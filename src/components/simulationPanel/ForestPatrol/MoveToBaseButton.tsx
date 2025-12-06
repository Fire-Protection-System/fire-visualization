import { Button } from "@mui/material";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../../store/reduxStore";
import { sendBrigadeOrForesterMoveToBaseOrder } from "../../../store/reducers/serverCommunicationReducers";

type Props = {
   forestPatrolID: number;
}
export default function MoveToBaseButton(props: Readonly<Props>) {
   const dispatch: AppDispatch = useDispatch();
   
   const handleClick = () => {
      dispatch(sendBrigadeOrForesterMoveToBaseOrder(props.forestPatrolID, "forester"));
   }

   return (
      <Button variant="contained" color="secondary" onClick={handleClick}>Move to Base</Button>
   )
}