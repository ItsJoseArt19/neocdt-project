// Utilidades para el uso de localStorage

export const initializeStorage = () => {
    if (!localStorage.getItem("users")) {
        localStorage.setItem("users", JSON.stringify([]));
    }
    if (!localStorage.getItem("currentUser")) {
        localStorage.setItem("currentUser", null);
    }
};

// Validaciones
export const validateDocumentNumber = (type, number) => {
    if (type === "CC") {
        return /^\d{10}$/.test(number);
    } else if (type === "CE") {
        return /^\d{6,10}$/.test(number);
    }
    return false;
};

export const validatePassword = (password) => {
    return /^\d{4}$/.test(password);   
};

export const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone) => {
    return /^3\d{10}$/.test(phone); 
}

export const loginUser = (documentType, documentNumber, password) => {

    if (!validateDocumentNumber(documentType, documentNumber) || !validatePassword(password)) {
        return null;
    }
    const users = JSON.parse(localStorage.getItem("users")) || [];
    return users.find((u) => 
        u.documentNumber === documentNumber &&
        u.password === password &&
        u.documentType === documentType
    ) || null;
};

export const registerUser = (userData) => {
    const {documentType, documentNumber, email, phone, password} = userData;
    
    if (!validateDocumentNumber(documentType, documentNumber)) {
        return "Formato de documento Inválido";
    }
    if (!validatePassword(password)) {
        return "La clave debe ser de 4 digitos";
    }
    if (email && !validateEmail(email)) {
        return "Correo Electronico Invalido";
    }
    if (phone && !validatePhone(phone)) {
        return "Numero de telefono Invalido";
    }

    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.find((u) => u.documentNumber === documentNumber)) {
        return "Usuario ya registrado"; 
    }

    const newUser = {
        ...userData,
        availableFunds: 1000000 //Monto en la cuenta 
    }

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    return "Usuario registrado Exitosamente"
};

export const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem("currentUser"));
};

export const setCurrentUser = (user) => {
    localStorage.setItem("currentUser", JSON.stringify(user));
};

export const logoutUser = () => {
    localStorage.setItem("currentUser", null);
};

// Gestionar los fondos disponibles
export const getAvailableFunds = (userId) => {
    // Obtener fondos disponibles del usuario
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.documentNumber === userId);
    
    // Si no existe el campo availableFunds, asignarle un valor por defecto
    if (user && user.availableFunds === undefined) {
        user.availableFunds = 1000000; // 1 millón por defecto
        localStorage.setItem("users", JSON.stringify(users));
    }
    
    return user ? (user.availableFunds || 0) : 0;
};

export const updateAvailableFunds = (userId, newAmount) => {
    // Validación básica: el monto debe ser un número positivo
    if (typeof newAmount !== 'number' || isNaN(newAmount) || newAmount < 0) {
        console.error('El monto debe ser un número mayor o igual a cero');
        return false;
    }

    // Actualizar fondos disponibles del usuario
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.documentNumber === userId);
    
    if (userIndex >= 0) {
        // Guardar monto anterior para registro
        const previousAmount = users[userIndex].availableFunds || 0;
        
        // Actualizar monto
        users[userIndex].availableFunds = newAmount;
        localStorage.setItem("users", JSON.stringify(users));
        
        // Si es el usuario actual, actualizar también en currentUser
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (currentUser && currentUser.documentNumber === userId) {
            currentUser.availableFunds = newAmount;
            localStorage.setItem("currentUser", JSON.stringify(currentUser));
        }
        
        console.log(`Fondos actualizados: ${previousAmount.toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP'
        })} → ${newAmount.toLocaleString('es-CO', {
            style: 'currency',
            currency: 'COP'
        })}`);
        
        return true;
    }
    
    console.error('Usuario no encontrado');
    return false;
};