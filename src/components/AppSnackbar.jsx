// components/AppSnackbar.jsx
import { Snackbar, Alert } from "@mui/material";

const AppSnackbar = ({ open, onClose, message, severity = "success" }) => {
  return (
    <Snackbar
      key={message}                       // ← aquí!
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert
        onClose={onClose}
        severity={severity}
        variant="filled"
        sx={{ width: "100%" }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default AppSnackbar;