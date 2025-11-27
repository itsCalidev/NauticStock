class Validator {
    /**
     * Valida un objeto de datos contra un conjunto de reglas.
     * @param {Object} data - Los datos a validar (req.body).
     * @param {Object} rules - Las reglas de validación.
     * @returns {string|null} - Retorna el mensaje de error o null si es válido.
     */
    static validate(data, rules) {
        for (const field in rules) {
            const rule = rules[field];
            const value = data[field];

            // Regla: required
            if (rule.required && (value === undefined || value === null || value === '')) {
                return `El campo '${field}' es requerido`;
            }

            // Si no es requerido y no tiene valor, saltamos las otras validaciones
            if (!rule.required && (value === undefined || value === null || value === '')) {
                continue;
            }

            // Regla: minLength
            if (rule.minLength && String(value).length < rule.minLength) {
                return `El campo '${field}' debe tener al menos ${rule.minLength} caracteres`;
            }

            // Regla: maxLength
            if (rule.maxLength && String(value).length > rule.maxLength) {
                return `El campo '${field}' no puede tener más de ${rule.maxLength} caracteres`;
            }

            // Regla: numeric
            if (rule.numeric && !/^\d+$/.test(value)) {
                return `El campo '${field}' solo debe contener números`;
            }

            // Regla: email
            if (rule.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                return `El campo '${field}' debe ser un correo electrónico válido`;
            }
        }

        return null;
    }
}

module.exports = Validator;
