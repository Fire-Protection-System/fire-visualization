import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody
} from '@mui/material';
import { RootState } from '../store/reduxStore';

export default function SimulationDetailsTable() {
    const mapConfigState = useSelector((state: RootState) => {
        return state.mapConfiguration;
    });

    const {
        configuration: mapConfiguration,
        currentSectorId,
        fileSystemNode,
    } = mapConfigState || {};

    const sectors = mapConfiguration?.sectors || [];

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Sector Fire Status
            </Typography>
            <Paper sx={{ overflow: 'auto', maxHeight: 300 }}>
                <Table size="small" sx={{ '& td, & th': { px: 1, py: 0.5, fontSize: '0.75rem' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Sector ID</strong></TableCell>
                            <TableCell><strong>Fire Level</strong></TableCell>
                            <TableCell><strong>Burn Level</strong></TableCell>
                            <TableCell><strong>Extinguish Level</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sectors.map((sector, index) => (
                            <TableRow key={sector?.sectorId || `sector-${index}`}>
                                <TableCell>{sector?.sectorId ?? 'N/A'}</TableCell>
                                <TableCell>
                                    {sector?.initialState?.fireLevel !== undefined
                                        ? sector.initialState.fireLevel.toFixed(2)
                                        : '0.00'}
                                </TableCell>
                                <TableCell>
                                    {sector?.initialState?.burnLevel !== undefined
                                        ? sector.initialState.burnLevel.toFixed(2)
                                        : '0.00'}
                                </TableCell>
                                <TableCell>
                                    {sector?.initialState?.extinguishLevel !== undefined
                                        ? sector.initialState.extinguishLevel.toFixed(2)
                                        : '0.00'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

        </Box>
    );
}
