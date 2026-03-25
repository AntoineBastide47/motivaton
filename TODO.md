# MotivaTON — TODO

## Improve app interaction on Telegram
- [ ] Smooth out bot message formatting (group notifications, milestone alerts)

## Move to mainnet
- [ ] Switch `TON_RPC_URL` and `VITE_TON_ENDPOINT` to mainnet Toncenter endpoints
- [ ] Get mainnet API key from toncenter.com, update `VITE_TON_API_KEY` and `RPC_API_KEY`
- [ ] Deploy contract to mainnet, update `CONTRACT_ADDRESS` and `VITE_CONTRACT_ADDRESS`
- [ ] Fund operator wallet on mainnet
- [ ] Set production `PUBLIC_URL` for OAuth callbacks and bot webhook

## Switch to USDT (Jetton)
- [ ] Rewrite smart contract to accept Jetton deposits via `jetton_notify` instead of native TON
- [ ] Update contract claim/refund logic to send Jetton transfers instead of native TON
- [ ] Store USDT Jetton wallet address in the contract
- [ ] Update frontend transactions to send Jetton transfer messages to the USDT Jetton wallet contract
- [ ] Use mainnet USDT Jetton master address: `EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs`
- [ ] Update all display/formatting from TON to USDT in the UI
