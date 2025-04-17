// pages/team/index.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Box, Typography, useTheme } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import LockOpenOutlinedIcon         from "@mui/icons-material/LockOpenOutlined";
import SecurityOutlinedIcon         from "@mui/icons-material/SecurityOutlined";
import Header                       from "../../components/Header";
import { Token }                   from "../../theme";

const Team = () => {
  const theme  = useTheme();
  const colors = Token(theme.palette.mode);

  // 1) estado para las filas
  const [rows, setRows] = useState([]);

  // 2) fetch a tu API de usuarios
  useEffect(() => {
    axios.get("http://localhost:3000/users")
      .then(({ data }) => {
        const formatted = data.map(u => ({
          id:        u.id,
          name:      u.name,
          email:     u.email,
          matricula: u.account,
          grado:     u.ranks,
          access:    u.access,    // ya viene “administrator” / “capturista” / “consulta”
        }));
        setRows(formatted);
      })
      .catch(console.error);
  }, []);

  const columns = [
    { field: "name",      headerName: "Name",           flex: 1, cellClassName: "name-column--cell" },
    { field: "email",     headerName: "Email",          flex: 1 },
    { field: "matricula", headerName: "Matrícula",      flex: 1 },
    { field: "grado",     headerName: "Grado",          flex: 1 },
    {
      field: "access",
      headerName: "Nivel de Acceso",
      flex: 1,
      renderCell: ({ row: { access } }) => (
        <Box
          width="60%"
          m="0 auto"
          p="5px"
          display="flex"
          justifyContent="center"
          backgroundColor={
            access === "Administrador"
              ? colors.greenAccent[600]
              : access === "Capturista"
                ? colors.greenAccent[700]
                : colors.greenAccent[700]
          }
          borderRadius="4px"
        >
          {access === "Administrador" && <AdminPanelSettingsOutlinedIcon />}
          {access === "Capturista"    && <SecurityOutlinedIcon />}
          {access === "Consultor"      && <LockOpenOutlinedIcon />}
          <Typography color={colors.grey[100]} sx={{ ml: "5px" }}>
            {access}
          </Typography>
        </Box>
      )
    },
  ];

  return (
    <Box m="20px">
      <Header title="TEAM" subtitle="Team Members" />
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: colors.blueAccent[700],
            borderBottom: "none"
          },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": {
            borderTop: "none",
            backgroundColor: colors.blueAccent[700]
          },
          "& .MuiCheckbox-root": {
            color: `${colors.greenAccent[200]} !important`
          },
          "& .MuiDataGrid-toolbarContainer .MuiButton-text": {
            color: `${colors.grey[100]} !important`
          },
        }}
      >
        <DataGrid
          checkboxSelection
          rows={rows}           // <-- aquí ya pasamos los datos reales
          columns={columns}
          slots={{ toolbar: GridToolbar }}
        />
      </Box>
    </Box>
  );
};

export default Team;
