const { expect } = require('chai');
const { ethers } = require('hardhat');
const { deploy } = require('../scripts/hardhat.utils');
const { fraxTokenAddress, twisterFlashPoolAddress } = require('../config.json');

const AddressZero = ethers.constants.AddressZero;
const MaxUint256 = ethers.constants.MaxUint256;
const toDecimals = (val, decimals=18) => ethers.utils.parseUnits(val, decimals);
const encode = (types, values) => ethers.utils.defaultAbiCoder.encode(types, values);

const erc20Abi = [
    'function balanceOf(address owner) public view returns (uint)',
    'function approve(address spender, uint amount) public returns (bool)',
    'function allowance(address owner, address spender) public view returns (uint)',
    'function mint(address account, uint amount) public',
    'function transfer(address to, uint amount) public returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint amount)'
];

const twisterFlashPoolAbi = [
    'function maxFlashLoan(address token) external view returns (uint)',
    'function flashFee(address token, uint256 amount) external view returns (uint256)',
    'event FlashLoan(address indexed recipient, address indexed token, uint amount, uint fee)'
];

describe('[START] - TokenTwister.test.js', function() {
    before(async () => {
        const [signer] = await ethers.getSigners();
        this.frax = new ethers.Contract(
            fraxTokenAddress, 
            erc20Abi, 
            signer
        );
        this.twisterFlashPool = new ethers.Contract(
            twisterFlashPoolAddress, 
            twisterFlashPoolAbi, 
            signer
        );
        this.twisterFlashBorrower = await deploy(
            'TwisterFlashBorrower', [twisterFlashPoolAddress]
        );
    });

    describe(" -------- Successful Calls -------- ", () => {
        it('should successfully call a flashloan for 100 FRAX', async () => {
            /**
             * @dev Because there is a fee on the testnet contract, and because there 
             * isn't a profitable strategy for a flashloan on the testnet (on account of 
             * a lack of any liquidity), I simply mint some tokens from the frax contract
             * equal to the amount of the fee that the loan will incur. In practice, you
             * would expect your flashloan contract to earn the fee through arbitrage or 
             * through liquidations.
             */
            const token = this.frax.address;
            this.flashFee = await this.twisterFlashPool.flashFee(
                token, toDecimals('100')
            );
            const borrower = this.twisterFlashBorrower.address;
            await expect(this.frax.mint(borrower, this.flashFee))
                .to.emit(this.frax, 'Transfer')
                .withArgs(AddressZero, borrower, this.flashFee);

            /**
             * @dev The twisterFlashBorrower expects an encoded boolean value.
             * You can encode any kind of data there, instead, though. e.g.,
             * if you wanted to encode two address (for a token route through uni, for example), 
             * then you would change line 74 to: `encode(['address', 'address'], [tokenA, tokenB])`
             * However, the contract would need to be modified to decode a different parameter.
             */
            await expect(this.twisterFlashBorrower.flashBorrow(
                token,
                toDecimals('100'),
                encode(['bool'], [false])
            )).to.emit(this.twisterFlashPool, 'FlashLoan')
                .withArgs(borrower, token, toDecimals('100'), this.flashFee);

            expect(await this.frax.balanceOf(borrower)).to.be.equal(0);
        });
    });

    describe(" -------- Reverts -------- ", () => {
        describe("FlashLoan related reverts", () => {
            it('should revert when token is not flash lendable', async () => {
                await expect(
                    this.twisterFlashBorrower.flashBorrow(
                        AddressZero,
                        toDecimals('100'),
                        encode(['bool'], [false])
                    )
                ).to.be.reverted;
            });

            it('should revert when amount exceeds max flash loan', async () => {
                await expect(
                    this.twisterFlashBorrower.flashBorrow(
                        this.frax.address,
                        MaxUint256,
                        encode(['bool'], [false])
                    )
                ).to.be.reverted;
            });

            it('should revert when flash borrower callback fails', async () => {
                await expect(
                    this.twisterFlashBorrower.flashBorrow(
                        this.frax.address,
                        '0',
                        encode(['bool'], [true])
                    )
                ).to.be.reverted;
            });
        });
    });
});
