import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { lineaSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Linea Token Staking App',
  projectId: 'YOUR_PROJECT_ID',
  chains: [lineaSepolia],
  ssr: true,
});