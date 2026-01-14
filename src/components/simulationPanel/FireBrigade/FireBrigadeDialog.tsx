import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../store/reduxStore";
import { useState, useEffect } from "react";
import { Button, Dialog, DialogTitle, DialogContent, Divider, List, ListItem, DialogActions } from "@mui/material";
import { Camera } from "../../../model/camera";
import { FireBrigade } from "../../../model/FireBrigade";
import { ForesterPatrol } from "../../../model/ForesterPatrol";
import { Sensor } from "../../../model/sensor";
import { getObjectsInSector } from '@shared/utils/configuration/getObjectsInSector';
import RenderSimulationItem from "../RenderSimulationItem";
import { MapWrapper } from "../../maps/MapWrapper";
import { MainMap } from "../../maps/MainMap";
import { FireBrigadeMap } from "../../maps/FireBrigadeMap";
import { sendBrigadeOrForesterMoveOrder } from "../../../store/serverCommunicationReducers";

type Props = {
   fireBrigadeID: number;
   forceOpen?: boolean;
   onClose?: () => void;
}

export default function FireBrigadeDialog(props: Props) {
   const {
      configuration: mapConfiguration,
      currentSectorId,
   } = useSelector((state: RootState) => state.mapConfiguration);

   const dispatch: AppDispatch = useDispatch();

   const [targetSector, setTargetSector] = useState<number | null>(null);
   const [open, setOpen] = useState(props.forceOpen || false);

   // Update internal open state if forceOpen prop changes
   useEffect(() => {
      if (props.forceOpen !== undefined) {
         setOpen(props.forceOpen);
      }
   }, [props.forceOpen]);

   const handleClickOpen = () => {
      setOpen(true);
   };

   const handleClose = () => {
      setTargetSector(null);
      setOpen(false);
      if (props.onClose) {
         props.onClose();
      }
   };

   // If currentSectorId is null, we can't show the "source" info, but we might still want to open it
   // However, the original logic line 40 returns null. Let's keep it but allow forced open.
   if (currentSectorId === null && !props.forceOpen) {
      return null;
   }

   const onSelectTargetSector = (sectorId: number) => {
      const sector = mapConfiguration.sectors.find((s) => s.sectorId === sectorId);
      if (sector) {
      }
      setTargetSector(sectorId);
   }

   const submitTargetSector = () => {
      if(targetSector === null) {
         return;
      }
      const sourceSector = mapConfiguration.sectors.find((s) => s.sectorId === currentSectorId);
      const targetSectorObj = mapConfiguration.sectors.find((s) => s.sectorId === targetSector);
      if (sourceSector && targetSectorObj) {
      } else {
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