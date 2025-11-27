import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    IconButton,
    useTheme,
    Chip
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Token } from "../../theme";
import api from "../../api/axiosClient";
import { Formik } from "formik";
import * as yup from "yup";
import { useSocket } from "../../context/SocketContext";
import usePermission from "../../hooks/usePermission";
import { useSearch } from "../../contexts/SearchContext";
import SearchHighlighter from "../../components/SearchHighlighter";
import { flexibleMatch } from "../../utils/searchUtils";

const Faq = () => {
    const theme = useTheme();
    const colors = Token(theme.palette.mode);
    const [faqs, setFaqs] = useState([]);
    const [categories, setCategories] = useState([]);
    const [open, setOpen] = useState(false);
    const [currentFaq, setCurrentFaq] = useState(null);
    const [deleteDialog, setDeleteDialog] = useState({
        open: false,
        faqId: null,
        question: ''
    });
    const socket = useSocket();
    const { can } = usePermission();
    const { searchTerm } = useSearch();

    const filteredFaqs = faqs.filter(faq => {
        const searchableText = `${faq.question} ${faq.answer} ${faq.category_name}`;
        return flexibleMatch(searchableText, searchTerm);
    });
    const navigate = useNavigate();

    useEffect(() => {
        if (!can('faq_read')) {
            navigate('/');
        }
    }, [can, navigate]);

    const fetchFaqs = useCallback(async ({ silent = false } = {}) => {
        try {
            const response = await api.get("/api/faqs");
            if (response.data.success) {
                setFaqs(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching FAQs:", error);
        }
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await api.get("/api/faqs/categories");
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    useEffect(() => {
        fetchFaqs();
        fetchCategories();
    }, [fetchFaqs]);

    // Escuchar eventos de Socket.io
    useEffect(() => {
        if (!socket) return;

        const handleFaqUpdate = (data) => {
            console.log('🔔 FAQ update received:', data);
            fetchFaqs({ silent: true });
        };

        const handleCategoryUpdate = (data) => {
            console.log('🔔 FAQ Category update received:', data);
            fetchCategories();
        };

        socket.on('faq_created', handleFaqUpdate);
        socket.on('faq_updated', handleFaqUpdate);
        socket.on('faq_deleted', handleFaqUpdate);
        socket.on('faq_status_changed', handleFaqUpdate);

        // Also listen for category changes as they affect the dropdown
        socket.on('category_created', handleCategoryUpdate); // Assuming this event exists or will exist
        socket.on('category_updated', handleCategoryUpdate);
        socket.on('category_deleted', handleCategoryUpdate);

        return () => {
            socket.off('faq_created', handleFaqUpdate);
            socket.off('faq_updated', handleFaqUpdate);
            socket.off('faq_deleted', handleFaqUpdate);
            socket.off('faq_status_changed', handleFaqUpdate);
            socket.off('category_created', handleCategoryUpdate);
            socket.off('category_updated', handleCategoryUpdate);
            socket.off('category_deleted', handleCategoryUpdate);
        };
    }, [socket, fetchFaqs]);

    const handleOpen = (faq = null) => {
        setCurrentFaq(faq);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentFaq(null);
    };

    const handleDelete = (id, question) => {
        setDeleteDialog({ open: true, faqId: id, question: question });
    };

    const confirmDelete = async () => {
        try {
            await api.delete(`/api/faqs/${deleteDialog.faqId}`);
            // fetchFaqs(); // Socket will handle update
        } catch (error) {
            console.error("Error deleting FAQ:", error);
        } finally {
            setDeleteDialog({ open: false, faqId: null, question: '' });
        }
    };

    const handleFormSubmit = async (values) => {
        try {
            if (currentFaq) {
                await api.put(`/api/faqs/${currentFaq.id}`, values);
            } else {
                await api.post("/api/faqs", values);
            }
            // fetchFaqs(); // Socket will handle update
            handleClose();
        } catch (error) {
            console.error("Error saving FAQ:", error);
        }
    };

    const checkoutSchema = yup.object().shape({
        question: yup.string().required("Requerido"),
        answer: yup.string().required("Requerido"),
        category_id: yup.string().nullable(),
    });

    const initialValues = {
        question: currentFaq ? currentFaq.question : "",
        answer: currentFaq ? currentFaq.answer : "",
        category_id: currentFaq ? currentFaq.category_id : "",
    };

    return (
        <Box m="20px">
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h4" fontWeight="bold" color={colors.grey[100]}>
                    Preguntas Frecuentes (FAQ)
                </Typography>
                {can('faq_create') && (
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<AddCircleIcon />}
                        onClick={() => handleOpen()}
                    >
                        Nueva Pregunta
                    </Button>
                )}
            </Box>

            {filteredFaqs.map((faq) => (
                <Accordion key={faq.id} defaultExpanded={false} sx={{ backgroundColor: colors.primary[400], mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box display="flex" justifyContent="space-between" width="100%" alignItems="center">
                            <Typography color={colors.greenAccent[500]} variant="h5">
                                <SearchHighlighter text={faq.question} searchTerm={searchTerm} />
                            </Typography>
                            <Box>
                                {faq.category_name && (
                                    <Chip
                                        label={<SearchHighlighter text={faq.category_name} searchTerm={searchTerm} />}
                                        size="small"
                                        sx={{ mr: 2 }}
                                    />
                                )}
                                {can('faq_update') && (
                                    <IconButton onClick={(e) => { e.stopPropagation(); handleOpen(faq); }} size="small">
                                        <EditIcon />
                                    </IconButton>
                                )}
                                {can('faq_delete') && (
                                    <IconButton onClick={(e) => { e.stopPropagation(); handleDelete(faq.id, faq.question); }} size="small" color="error">
                                        <DeleteIcon />
                                    </IconButton>
                                )}
                            </Box>
                        </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Typography>
                            <SearchHighlighter text={faq.answer} searchTerm={searchTerm} />
                        </Typography>
                    </AccordionDetails>
                </Accordion>
            ))}

            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{currentFaq ? "Editar Pregunta" : "Nueva Pregunta"}</DialogTitle>
                <DialogContent>
                    <Formik
                        onSubmit={handleFormSubmit}
                        initialValues={initialValues}
                        validationSchema={checkoutSchema}
                    >
                        {({
                            values,
                            errors,
                            touched,
                            handleBlur,
                            handleChange,
                            handleSubmit,
                        }) => (
                            <form onSubmit={handleSubmit} id="faq-form">
                                <Box display="grid" gap="30px" gridTemplateColumns="repeat(4, minmax(0, 1fr))" sx={{ mt: 2 }}>
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        type="text"
                                        label="Pregunta"
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.question}
                                        name="question"
                                        error={!!touched.question && !!errors.question}
                                        helperText={touched.question && errors.question}
                                        sx={{ gridColumn: "span 4" }}
                                    />
                                    <TextField
                                        fullWidth
                                        variant="filled"
                                        type="text"
                                        label="Respuesta"
                                        multiline
                                        rows={4}
                                        onBlur={handleBlur}
                                        onChange={handleChange}
                                        value={values.answer}
                                        name="answer"
                                        error={!!touched.answer && !!errors.answer}
                                        helperText={touched.answer && errors.answer}
                                        sx={{ gridColumn: "span 4" }}
                                    />
                                    <FormControl fullWidth variant="filled" sx={{ gridColumn: "span 4" }}>
                                        <InputLabel>Categoría</InputLabel>
                                        <Select
                                            value={values.category_id}
                                            onChange={handleChange}
                                            onBlur={handleBlur}
                                            name="category_id"
                                        >
                                            <MenuItem value="">
                                                <em>Ninguna</em>
                                            </MenuItem>
                                            {categories.map((cat) => (
                                                <MenuItem key={cat.id} value={cat.id}>
                                                    {cat.name}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </form>
                        )}
                    </Formik>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="inherit">
                        Cancelar
                    </Button>
                    <Button type="submit" form="faq-form" color="secondary" variant="contained">
                        Guardar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de confirmación de eliminación */}
            <Dialog
                open={deleteDialog.open}
                onClose={() => setDeleteDialog({ ...deleteDialog, open: false })}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    Confirmar Eliminación
                </DialogTitle>
                <DialogContent>
                    <Typography>
                        ¿Estás seguro de que deseas eliminar la pregunta "{deleteDialog.question}"?
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ ...deleteDialog, open: false })} color="inherit">
                        Cancelar
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        color="error"
                        autoFocus
                    >
                        Eliminar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Faq;
