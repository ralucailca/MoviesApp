import { useEffect, useState } from 'react';
import { NetworkStatus, Plugins } from '@capacitor/core';

const { Network } = Plugins;

const initialState = {
  connected: false,
  connectionType: 'unknown',
}

const useNetwork = () => {
  const [networkStatus, setNetworkStatus] = useState(initialState)
  useEffect(() => {
    const handler = Network.addListener('networkStatusChange', handleNetworkStatusChange);
    Network.getStatus().then(handleNetworkStatusChange);
    let canceled = false;
    return () => {
      canceled = true;
      handler.remove();
    }

    function handleNetworkStatusChange(status: NetworkStatus) {
      console.log('useNetwork - status change', status);
      if (!canceled) {
        setNetworkStatus(status);
      }
    }
  }, [])
  return { networkStatus };
};

export default useNetwork;