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

export default function ActorsDetailsTable() {
    const mapConfigState = useSelector((state: RootState) => {
        return state.mapConfiguration;
    });

    const {
        configuration: mapConfiguration,
        currentSectorId,
        fileSystemNode,
    } = mapConfigState || {};

    const actors = mapConfiguration?.fireBrigades || [];

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Sector Fire Status
            </Typography>
            <Paper sx={{ overflow: 'auto', maxHeight: 300 }}>
                <Table size="small" sx={{ '& td, & th': { px: 1, py: 0.5, fontSize: '0.75rem' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Fire Bridage ID</strong></TableCell>
                            <TableCell><strong>Actor State</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {actors.map((actor, index) => (
                            <TableRow key={actor?.fireBrigadeId || `sector-${index}`}>
                                <TableCell>{actor?.fireBrigadeId ?? 'N/A'}</TableCell>
                                <TableCell>
                                    {actor?.state !== undefined
                                        ? actor?.state
                                        : 'UNDEFINED'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Paper>

        </Box>
    );
}
