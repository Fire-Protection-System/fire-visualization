import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/reduxStore";
import { useState } from "react";
import { Button, Dialog, DialogTitle, DialogContent, Divider, List, ListItem, DialogActions } from "@mui/material";
import { Camera } from "../../../model/camera";
import { FireBrigade } from "../../../model/FireBrigade";
import { ForesterPatrol } from "../../../model/ForesterPatrol";
import { Sensor } from "../../../model/sensor";
import { getObjectsInSector } from "../../../utils/configuration/getObjectsInSector";
import RenderSimulationItem from "../RenderSimulationItem";
import { MapWrapper } from "../../maps/MapWrapper";
import { MainMap } from "../../maps/maps/MainMap";
import { FireBrigadeMap } from "../../maps/maps/FireBrigadeMap";
import { sendBrigadeOrForesterMoveOrder } from "../../../store/reducers/serverCommunicationReducers";

type Props = {
   fireBrigadeID: number;
}

export default function FireBrigadeDialog(props: Props) {
   const {
      configuration: mapConfiguration,
      currentSectorId,
   } = useSelector((state: RootState) => state.mapConfiguration);

   const dispatch: AppDispatch = useDispatch();

   const [targetSector, setTargetSector] = useState<number | null>(null);
   const [open, setOpen] = useState(false);

   const handleClickOpen = () => {
      setOpen(true);
   };

   const handleClose = () => {
      setTargetSector(null);
      setOpen(false);
   };

   if (currentSectorId === null) {
      return null;
   }

   const onSelectTargetSector = (sectorId: number) => {
      setTargetSector(sectorId);
   }

   const submitTargetSector = () => {
      if(targetSector === null) {
         console.error("Target sector is null");
         return;
      }
      dispatch(sendBrigadeOrForesterMoveOrder(props.fireBrigadeID, targetSector, "brigade"));
      handleClose();
   }

   return (
      <>
         <Button variant="contained" sx={{ width: '150px' }} onClick={handleClickOpen}>Move</Button>

         <Dialog
            open={open}
            onClose={handleClose}
            fullWidth={true}
            maxWidth='sm'
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
         >
            <DialogTitle id="alert-dialog-title" sx={{ textAlign: 'center' }}>
               Move Brigade
            </DialogTitle>
            <DialogContent>
               <MapWrapper>
                  <FireBrigadeMap targetSectorId={targetSector} onClickHandler={onSelectTargetSector}/>
               </MapWrapper>
            </DialogContent>
            <DialogActions>
               <Button variant="contained" color='primary' disabled={targetSector === null} onClick={submitTargetSector}>
                  Move
               </Button>
               <Button onClick={handleClose} variant="contained" color='error'>
                  Close
               </Button>
            </DialogActions>
         </Dialog>
      </>
   );
}