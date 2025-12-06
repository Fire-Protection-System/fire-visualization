import { Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/reduxStore";
import { sendBrigadeOrForesterMoveToBaseOrder } from "../../../store/reducers/serverCommunicationReducers";

type Props = {
   fireBrigadeID: number;
}
export default function MoveToBaseButton(props: Readonly<Props>) {
   const dispatch: AppDispatch = useDispatch();
   
   const handleClick = () => {
      dispatch(sendBrigadeOrForesterMoveToBaseOrder(props.fireBrigadeID, "brigade"));
   }

   return (
      <Button variant="contained" color="secondary" onClick={handleClick}>Move to Base</Button>
   )
}