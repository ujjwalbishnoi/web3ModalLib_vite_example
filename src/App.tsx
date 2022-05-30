import "./App.css";
import React, { useState, useCallback, useEffect } from "react";
import { ethers } from "ethers";
import { Web3Provider } from "@ethersproject/providers";

import web3ModalSetup from "./utils/web3ModalSetup";
import { NETWORKS } from "./constants";
import { injected } from "web3modal/dist/providers/connectors";

/// 📡 What chain are your contracts deployed to?
// const initialNetwork = NETWORKS.localhost; // <------- select your target frontend network (localhost, rinkeby, xdai, mainnet)

const web3Modal = web3ModalSetup();

function App() {
  const [injectedProvider, setInjectedProvider] = useState<Web3Provider | null>(
    null
  );

  const logoutOfWeb3Modal = async () => {
    await web3Modal.clearCachedProvider();
    if (
      injectedProvider &&
      injectedProvider.provider &&
      typeof injectedProvider.provider.disconnect === "function"
    ) {
      const resp = await injectedProvider.provider.disconnect();
      console.log("diconnected successfully", resp);
    }
    // setTimeout(() => {
    //   window.location.reload();
    // }, 1);
  };

  const loadWeb3Modal = useCallback(async () => {
    console.log("loadWeb3Modal started");
    const provider = await web3Modal.connect();

    setInjectedProvider(new ethers.providers.Web3Provider(provider));

    provider.on("chainChanged", (chainId: string) => {
      console.log(`chain changed to ${chainId}! updating providers`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    provider.on("accountsChanged", () => {
      console.log(`account changed!`);
      setInjectedProvider(new ethers.providers.Web3Provider(provider));
    });

    // Subscribe to session disconnection
    provider.on("disconnect", (code: string, reason: string) => {
      console.log(code, reason);
      logoutOfWeb3Modal();
    });
    // eslint-disable-next-line
  }, [setInjectedProvider]);

  // useEffect(() => {
  //   if (web3Modal.cachedProvider) {
  //     loadWeb3Modal();
  //   }
  // }, [loadWeb3Modal]);

  useEffect(() => {
    return () => {
      logoutOfWeb3Modal();
    };
  }, []);

  // useEffect(() => {
  //   if (injectedProvider !== null) {
  //     console.log("hehe......");
  //     setTimeout(() => {
  //       console.log("dispatching logout func");
  //       logoutOfWeb3Modal();
  //     }, 5000);
  //   }
  // }, [injectedProvider]);

  console.log(injectedProvider);

  return (
    <div className="App">
      <button onClick={loadWeb3Modal}>Connect</button>
    </div>
  );
}

export default App;
