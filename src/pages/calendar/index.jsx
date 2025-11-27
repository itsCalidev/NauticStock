import React, { useState, useEffect, useCallback } from "react";
import { Box, useTheme, Typography, CircularProgress, Tooltip } from "@mui/material";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import Header from "../../components/Header";
import { Token } from "../../theme";
import api from "../../api/axiosClient";
import { useSocket } from "../../context/SocketContext";
import usePermission from "../../hooks/usePermission";
import { useNavigate } from "react-router-dom";

const Calendar = () => {
    const theme = useTheme();
    const colors = Token(theme.palette.mode);
    const [currentEvents, setCurrentEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const { can } = usePermission();
    const navigate = useNavigate();
    const socket = useSocket();

    const [orders, setOrders] = useState([]);

    useEffect(() => {
        if (!can('calendar_read')) {
            navigate('/');
        }
    }, [can, navigate]);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/api/orders");
            const fetchedOrders = Array.isArray(data) ? data : data?.data || [];
            setOrders(fetchedOrders);
        } catch (error) {
            console.error("Error fetching orders for calendar:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (can('calendar_read')) {
            fetchOrders();
        }
    }, [fetchOrders, can]);

    useEffect(() => {
        // Filtrar ordenes que tengan fecha esperada y formatear eventos
        const events = orders
            .filter(order => order.expected_date)
            .map(order => ({
                id: order.id,
                title: `${order.product_name} (${order.provider_name})`,
                start: order.expected_date,
                allDay: true,
                backgroundColor: colors.greenAccent[500],
                borderColor: colors.greenAccent[600],
                extendedProps: {
                    provider: order.provider_name,
                    status: order.status,
                    notes: order.notes
                }
            }));
        setCurrentEvents(events);
    }, [orders, colors.greenAccent]);

    // Real-time updates
    useEffect(() => {
        if (!socket) return;

        const handleOrderUpdate = () => {
            fetchOrders();
        };

        socket.on('order_created', handleOrderUpdate);
        socket.on('order_updated', handleOrderUpdate);
        socket.on('order_deleted', handleOrderUpdate);

        return () => {
            socket.off('order_created', handleOrderUpdate);
            socket.off('order_updated', handleOrderUpdate);
            socket.off('order_deleted', handleOrderUpdate);
        };
    }, [socket, fetchOrders]);

    const renderEventContent = (eventInfo) => {
        return (
            <Tooltip
                title={
                    <Box>
                        <Typography variant="body2">Proveedor: {eventInfo.event.extendedProps.provider}</Typography>
                        <Typography variant="body2">Estado: {eventInfo.event.extendedProps.status}</Typography>
                        {eventInfo.event.extendedProps.notes && (
                            <Typography variant="caption">Nota: {eventInfo.event.extendedProps.notes}</Typography>
                        )}
                    </Box>
                }
            >
                <Box sx={{ p: "2px 4px", cursor: "pointer", overflow: "hidden", textOverflow: "ellipsis" }}>
                    <Typography variant="body2" noWrap>
                        {eventInfo.event.title}
                    </Typography>
                </Box>
            </Tooltip>
        );
    };

    if (loading && currentEvents.length === 0) {
        return (
            <Box m="20px" display="flex" justifyContent="center" alignItems="center" height="50vh">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box m="20px">
            <Header title="CALENDARIO DE ORDENES" subtitle="Vista de llegadas esperadas de ordenes" />

            <Box display="flex" justifyContent="space-between">
                <Box flex="1 1 100%" ml="15px">
                    <FullCalendar
                        height="75vh"
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin]}
                        headerToolbar={{
                            left: "prev,next today",
                            center: "title",
                            right: "dayGridMonth,timeGridWeek,timeGridDay,listMonth",
                        }}
                        initialView="dayGridMonth"
                        editable={false}
                        selectable={false}
                        selectMirror={true}
                        dayMaxEvents={true}
                        events={currentEvents}
                        eventContent={renderEventContent}
                        locale="es"
                        buttonText={{
                            today: 'Hoy',
                            month: 'Mes',
                            week: 'Semana',
                            day: 'Día',
                            list: 'Lista'
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default Calendar;
