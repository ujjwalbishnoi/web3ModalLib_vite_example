import { ExternalProvider } from '@ethersproject/providers';

import { SupportedChainId } from '../../params/constants/chains';
import { CHAIN_INFO } from '../../params/constants/chainInfo';

interface UnRecognizedNetworkError extends Error {
	code: number;
}

interface SwitchNetworkArguments {
	provider: ExternalProvider;
	chainId: SupportedChainId;
}

function getRpcUrls(chainId: SupportedChainId): [string] {
	switch (chainId) {
		case SupportedChainId.POLYGON_MUMBAI_TESTNET:
			return ['https://matic-mumbai.chainstacklabs.com'];
		default:
	}
	// Our API-keyed URLs will fail security checks when used with external wallets.
	throw new Error('RPC URLs must use public endpoints');
}

// provider.request returns Promise<any>, but wallet_switchEthereumChain must return null or throw
// see https://github.com/rekmarks/EIPs/blob/3326-create/EIPS/eip-3326.md for more info on wallet_switchEthereumChain
export default async function switchToNetwork({
	provider,
	chainId,
}: SwitchNetworkArguments): Promise<null | void> {
	if (!provider.request) {
		return;
	}
	const info = CHAIN_INFO[chainId];

	try {
		await provider.request({
			method: 'wallet_switchEthereumChain',
			params: [{ chainId: info.chainIdInHex }],
		});
	} catch (error) {
		// 4902 is the error code for attempting to switch to an unrecognized chainId
		if (
			(error as UnRecognizedNetworkError).code === 4902 ||
			(typeof error === 'string' &&
				error.search('Unrecognized chain ID') !== -1)
		) {
			await provider.request({
				method: 'wallet_addEthereumChain',
				params: [
					{
						chainId: info.chainIdInHex,
						chainName: info.chainName,
						rpcUrls: getRpcUrls(chainId),
						nativeCurrency: info.nativeCurrency,
						blockExplorerUrls: info.blockExplorerUrl,
					},
				],
			});
			// metamask (only known implementer) automatically switches after a network is added
			// the second call is done here because that behavior is not a part of the spec and cannot be relied upon in the future
			// metamask's behavior when switching to the current network is just to return null (a no-op)
			try {
				await provider.request({
					method: 'wallet_switchEthereumChain',
					params: [{ chainId: info.chainIdInHex }],
				});
			} catch (newError) {
				console.debug(
					'Added network but could not switch chains',
					newError
				);
			}
		} else {
			throw error;
		}
	}
}
