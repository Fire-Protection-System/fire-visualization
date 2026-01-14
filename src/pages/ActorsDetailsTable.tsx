import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody,
    Button,
    Chip
} from '@mui/material';
import { RootState } from '../store/reduxStore';
import { useMemo, useCallback } from 'react';
import { sendBrigadeOrForesterMoveOrder } from '../store/serverCommunicationReducers';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../store/reduxStore';

export default function ActorsDetailsTable() {
    const dispatch: AppDispatch = useDispatch();
    const mapConfigState = useSelector((state: RootState) => state.mapConfiguration);
    const recommendations = useSelector((state: RootState) => state.recommendation.recommendations);

    const {
        configuration: mapConfiguration,
    } = mapConfigState || {};

    const fireBrigades = mapConfiguration?.fireBrigades || [];
    const foresterPatrols = mapConfiguration?.foresterPatrols || [];

    // Combine all agents with their type
    const agents = useMemo(() => {
        const brigades = fireBrigades.map((fb: any) => ({
            id: fb.fireBrigadeId,
            type: 'Fire Brigade' as const,
            state: fb.state || 'UNKNOWN',
            sectorId: fb.sectorId || 0,
            agent: fb,
        }));

        const patrols = foresterPatrols.map((fp: any) => ({
            id: fp.foresterPatrolId,
            type: 'Forester Patrol' as const,
            state: fp.state || 'UNKNOWN',
            sectorId: fp.sectorId || 0,
            agent: fp,
        }));

        return [...brigades, ...patrols];
    }, [fireBrigades, foresterPatrols]);

    const handleRunRecommendation = useCallback((unitId: number, sectorId: number, agentType: 'Fire Brigade' | 'Forester Patrol') => {
        const type = agentType === 'Fire Brigade' ? 'brigade' : 'forester';
        dispatch(sendBrigadeOrForesterMoveOrder(unitId, sectorId, type));
    }, [dispatch]);

    const getRecommendationForAgent = useCallback((agentId: number, agentType: 'Fire Brigade' | 'Forester Patrol') => {
        const typedKey = agentType === 'Fire Brigade'
            ? `fireBrigade:${agentId}`
            : `foresterPatrol:${agentId}`;

        const recommendation = recommendations[typedKey] || recommendations[String(agentId)];
        if (!recommendation || !recommendation.sectorId) {
            return null;
        }
        return recommendation;
    }, [recommendations]);

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Agent Status
            </Typography>
            <Paper sx={{ overflow: 'auto', maxHeight: 400 }}>
                <Table size="small" sx={{ '& td, & th': { px: 1, py: 0.5, fontSize: '0.75rem' } }}>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Agent</strong></TableCell>
                            <TableCell><strong>Type</strong></TableCell>
                            <TableCell><strong>State</strong></TableCell>
                            <TableCell><strong>Sector</strong></TableCell>
                            <TableCell><strong>Rec</strong></TableCell>
                            <TableCell><strong>Apply</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {agents.map((agent) => {
                            const recommendation = getRecommendationForAgent(agent.id, agent.type);
                            // Use "EX->" for Forester Patrols, "MV->" for Fire Brigades
                            const recommendationPrefix = agent.type === 'Forester Patrol' ? 'EX->' : 'MV->';
                            const recommendationText = recommendation 
                                ? `${recommendationPrefix}${recommendation.sectorId}` 
                                : '';
                            
                            return (
                                <TableRow key={`${agent.type}-${agent.id}`}>
                                    <TableCell>{agent.id}</TableCell>
                                    <TableCell>
                                        <Chip 
                                            label={agent.type === 'Fire Brigade' ? 'FB' : 'FP'} 
                                            size="small"
                                            color={agent.type === 'Fire Brigade' ? 'error' : 'success'}
                                            sx={{ fontSize: '0.7rem', height: '20px' }}
                                        />
                                    </TableCell>
                                    <TableCell>{agent.state}</TableCell>
                                    <TableCell>{agent.sectorId > 0 ? agent.sectorId : '-'}</TableCell>
                                    <TableCell>
                                        {recommendationText || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {recommendation && recommendation.sectorId ? (
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="primary"
                                                onClick={() => handleRunRecommendation(
                                                    agent.id,
                                                    Number(recommendation.sectorId),
                                                    agent.type
                                                )}
                                                sx={{ fontSize: '0.7rem', py: 0.25, px: 1, minWidth: '60px' }}
                                            >
                                                Apply
                                            </Button>
                                        ) : (
                                            <span style={{ color: '#999' }}>-</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Paper>
        </Box>
    );
}
