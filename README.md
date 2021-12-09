# TwisterFlashBorrower
This is a simple demonstration of how to perform a flashloan using the pooled funds in the TwisterCash FRAX mixer. This example runs, but it's expected that you would modify the contract to perform your own tests.

## Installation & Usage
Install using npm or yarn.
```sh
$ git clone https://github.com/Nobody-Labs/twister-flashloan-example
$ cd twister-flashloan-example
$ yarn
```

Run the tests. The tests use a fork of RinkArby testnet.
```sh
$ npx hardhat test
```

## [test script](./test/TwisterFlashBorrower.test.js)
See this script for an example of how to call the flashloan contract from your own borrowing contract. The input to your flashloan logic is contained in the `data` parameter.

## [flash borrower](./contracts/TwisterFlashBorrower.sol)
See this contract for an example of how to retrieve the data encoded in the test. This contract doesn't do anything except for check if the tx should pass or fail, then it returns control to the lender to collect the loan and the fee. In practice, though, this contract should be far more robust, using arbitrage or liquidations to generate the flashFee.