import { APIProvider } from '@vis.gl/react-google-maps';
import { ReactNode } from 'react';

type MapWrapperProps = {
  children: ReactNode;
};

export const MapWrapper = ({ children }: MapWrapperProps) => {
  return <APIProvider apiKey={process.env.GOOGLE_API_KEY}>{children}</APIProvider>;
};
