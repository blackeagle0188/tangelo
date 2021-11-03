# TODO
• write test for setCollectionCollateralizationRatio and setCollectionInterestPercent
• Setup Events - they are declared they just need to be emitted properly
• Contract should have withdrawOnly state where things can be withdrawn but not deposited
• Handle interest accrual
• Handle foreclosure gains and losses
• Ensure liquidity reserve for withdraws
• Oracle for updating floor prices


Write oracle script
    get data from wgmi.io
    every hour, write and run script
    if 1% price difference, update in contract with setCollectionFloorPrice
    if price difference more than 10%, trigger alert.

v2
• Give TGL token to lenders and borrowers


Testing info:
Dragons NFT -  0xee5694217793f22dd18ebf0fe12ca09181da1d35
Wands NFT - 0x896e3344fbe5f21561e3cb5b6133a3b80b9e2a93
Potions - 0x02a70fb14f6b61d1ecbeca64bdc27ae56c564a59
Local owner - 0xd1EbCA406063206484460f85498C5dbb74442002
Deployed Tangelo sol - 0xA0C28fdFF255B72e71d06C006547b0b6D2E0Bc23


Interest accrual:
Increase value of TLP in proportion to interest paid
Increase loan balances for everyone

Interest rate index = 218
0 - 10, TIMESTAMP
1 - 11, TIMESTAMP
2 - 12, TIMESTAMP

