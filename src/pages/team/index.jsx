// src/pages/team/index.jsx
import React, { useState, useEffect, useCallback } from "react";
import axios from "../../api/axiosClient";
import { Box, Button, Chip, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import EditIcon        from "@mui/icons-material/Edit";
import BlockIcon       from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Header          from "../../components/Header";
import { Token }       from "../../theme";
import { useNavigate } from "react-router-dom";

const Team = () => {
  const theme  = useTheme();
  const colors = Token(theme.palette.mode);
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  const fetchUsers = useCallback(() => {
    axios.get("/users")
      .then(({ data }) => {
        const me = JSON.parse(localStorage.getItem("user") || "{}");
        const mapped = data
          .filter(u => u.id !== me.id)
          .map(u => ({
            id:         u.id,
            name:       u.name,
            email:      u.email,
            matricula:  u.account,
            grado:      u.ranks,
            access:     u.access,
            status:     u.status,
            // asignamos directamente el string ISO de last_access
            lastAccess: u.last_access ?? null,
          }));
        console.log("Mapped rows:", mapped);  // <— Verifica aquí que cada objeto tenga lastAccess
        setRows(mapped);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleStatus = async (id, current) => {
    try {
      await axios.put(`/users/${id}`, { status: current === 0 ? 1 : 0 });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleEdit = id => {
    navigate(`/users/${id}/edit`);
  };

  const columns = [
    { field: "name",      headerName: "Name",      flex: 1, cellClassName: "name-column--cell" },
    { field: "email",     headerName: "Email",     flex: 1 },
    { field: "matricula", headerName: "Matrícula", flex: 1 },
    { field: "grado",     headerName: "Grado",     flex: 1 },
    {
      field: "access",
      headerName: "Nivel de Acceso",
      flex: 1,
      renderCell: ({ row }) => (
        <Typography
          sx={{
            px: 1, py: 0.5, borderRadius: 1,
            bgcolor:
              row.access === "Administrador"
                ? colors.greenAccent[600]
                : colors.greenAccent[700],
            color: colors.grey[100],
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
          }}
        >
          {row.access === "Administrador" && "👑"}
          {row.access === "Capturista"     && "🔓"}
          {row.access === "Consultor"       && "🔒"}
          {row.access}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "Estado",
      flex: 0.5,
      renderCell: ({ row }) => (
        <Chip
          label={row.status === 0 ? "Activo" : "Inactivo"}
          color={row.status === 0 ? "success" : "default"}
          size="small"
        />
      ),
    },
    {
      field: "lastAccess",
      headerName: "Último Acceso",
      flex: 1,
      // Usamos renderCell para extraer el valor directamente de la fila
      renderCell: ({ row }) => {
        const dateStr = row.lastAccess;
        return dateStr
          ? new Date(dateStr).toLocaleString()
          : "—";
      },
    },
    {
      field: "actions",
      headerName: "Acciones",
      minWidth: 240,
      sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" alignItems="center" gap={1} height="100%">
          <Button
            size="small"
            variant="contained"
            color="warning"
            startIcon={<EditIcon />}
            onClick={() => handleEdit(row.id)}
            sx={{ minWidth: 80, whiteSpace: "nowrap" }}
          >
            EDITAR
          </Button>
          <Button
            size="small"
            variant="contained"
            color={row.status === 0 ? "error" : "success"}
            startIcon={row.status === 0 ? <BlockIcon /> : <CheckCircleIcon />}
            onClick={() => handleToggleStatus(row.id, row.status)}
            sx={{ minWidth: 100, whiteSpace: "nowrap" }}
          >
            {row.status === 0 ? "DESHABILITAR" : "REACTIVAR"}
          </Button>
        </Box>
      ),
    },
  ];

  return (
    <Box m="20px">
      <Header title="TEAM" subtitle="Team Members" />
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root":            { border: "none" },
          "& .MuiDataGrid-cell":            { borderBottom: "none" },
          "& .name-column--cell":           { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders":   { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root":            { color: `${colors.greenAccent[200]} !important` },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.grey[100]} !important`
          },
        }}
      >
        <DataGrid
          checkboxSelection
          rows={rows}
          columns={columns}
          slots={{ toolbar: GridToolbar }}
        />
      </Box>
    </Box>
  );
};

export default Team;
