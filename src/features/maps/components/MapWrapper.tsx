import { APIProvider } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';

type MapWrapperProps = {
  children: ReactNode;
};

export const MapWrapper = ({ children }: MapWrapperProps) => {
  // process.env.GOOGLE_API_KEY can be undefined in some envs; provide empty string fallback
  return <APIProvider apiKey={(process.env.GOOGLE_API_KEY ?? '') as string}>{children}</APIProvider>;
};
