import { useSelector} from 'react-redux';
import { Button } from '@mui/material';
import { RootState } from '././../../store/reduxStore';

const DownloadSimulationConfigurationButton: React.FC = () => {
  const mapConfiguration = useSelector((state: RootState) => state.mapConfiguration);

  const downloadFile = () => {
  
    if (!mapConfiguration?.configuration) {
      console.warn("Brak konfiguracji do pobrania.");
      return;
    }

    // create file in browser
    const fileName = "my-file";
    const json = JSON.stringify(mapConfiguration.configuration, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const href = URL.createObjectURL(blob);
  
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName + ".json";
    document.body.appendChild(link);
    link.click();
  
    link.remove();
    URL.revokeObjectURL(href);
  }
  
  return (
    <Button
      variant="contained"
      color='secondary'
      onClick={() => {
        downloadFile();        
      }}
      sx={{ width: '150px' }}      
    >
      Download Configuration
    </Button>
  );
};

export default DownloadSimulationConfigurationButton;