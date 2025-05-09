import { WalletProvider, WalletType } from '../../contexts/WalletContext';
import { ThorchainProvider, ThorchainTransferParams, VultisigThorchainProvider } from '../../types/wallets';
import { Client as ThorChainClient } from "@xchainjs/xchain-thorchain";
import { baseAmount } from "@xchainjs/xchain-util";

export const sendTransaction = async (
    params: ThorchainTransferParams,
    method: 'transfer' | 'deposit',
    walletType: WalletType,
    walletProvider: WalletProvider
): Promise<string> => {

    if (walletType === 'xdefi') {
        return new Promise((resolve, reject) => {
            // Try XDEFI first
            if (walletProvider) {
                (walletProvider as ThorchainProvider).request(
                    {
                        method,
                        params: [params],
                    },
                    (error, result) => {
                        if (error) {
                            reject(error);
                        } else {
                            resolve(result);
                        }
                    }
                );
                return;
            }

            // Try Vultisi
            reject(new Error("No compatible wallet found. Please install XDEFI or Vultisig extension."));
        });
    }

    if (walletType === 'vultisig') {
        if (walletProvider) {

            if (method === 'transfer') {
                const result = await (walletProvider as VultisigThorchainProvider).request({
                    method: "send_transaction",
                    params: [
                        {
                            from: params.from,
                            to: params.recipient,
                            data: params.memo,
                            value: params.amount.amount.toString(),
                        },
                    ],
                })
                return result;
            }

            if (method === 'deposit') {
                const result = await (walletProvider as VultisigThorchainProvider).request({
                    method: "deposit_transaction",
                    params: [{
                        from: params.from,
                        amount: params.amount,
                        data: params.memo,
                        asset: {
                            ticker: 'RUNE',
                            chain: 'RUNE',
                            symbol: 'RUNE',
                        }
                    }],
                });
                if (Object.keys(result).length === 0 && result.constructor === Object) {
                    throw Error("User cancel action"); // vulticonnect returns {} when user cancel action
                }
                return result;
            }
        }
    }

    if (walletType === 'keystore') {
        if (walletProvider) {
            if (method === 'transfer') {

                if (!params.recipient) {
                    throw new Error("Recipient is required for transfer");
                }
    
                const result = await (walletProvider as ThorChainClient).transfer({
                    recipient: params.recipient,
                    amount: baseAmount(params.amount.amount, params.amount.decimals),
                    memo: params.memo,
                });
                return result;
            }

            if (method === 'deposit') {
                const result = await (walletProvider as ThorChainClient).deposit({
                    amount: baseAmount(params.amount.amount, params.amount.decimals),
                    memo: params.memo,
                });
                return result;
            }
        }
    }


    throw new Error("No compatible wallet found. Please install XDEFI or Vultisig extension.");
}; 