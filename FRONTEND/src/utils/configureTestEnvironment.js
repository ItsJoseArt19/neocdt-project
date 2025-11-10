// Monto disponible para pruebas (se usará solo si no hay prompt)
const TEST_FUNDS = 1500000; // 1.5 millones por defecto

// Obtener el monto desde un prompt si estamos en el navegador
const PROMPT_FUNDS = typeof window !== 'undefined' ? 
    window.prompt("Ingresa el monto disponible deseado:", TEST_FUNDS) : null;

// ===== FUNCIONES DE CONFIGURACIÓN =====

/**
 * Configura el entorno de pruebas para la aplicación
 * @param {number} amount - Monto a establecer como disponible
 */
function setupTestEnvironment(amount) {
    // Usar el monto proporcionado, o el del prompt, o el predeterminado
    const fundsToSet = amount || 
                      (PROMPT_FUNDS !== null ? parseFloat(PROMPT_FUNDS) : TEST_FUNDS);
    
    // Validar que sea un número válido
    if (isNaN(fundsToSet)) {
        if (typeof window !== 'undefined') {
            window.alert('⚠️ Error: Debes ingresar un valor numérico válido');
        }
        console.error('❌ Error: Valor no numérico');
        return false;
    }
    
    // Obtener usuario actual
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    
    if (!currentUser) {
        if (typeof window !== 'undefined') {
            window.alert('⚠️ Error: Debes iniciar sesión primero');
        }
        console.error('❌ Error: Necesitas iniciar sesión primero');
        return false;
    }
    
    // Actualizar fondos disponibles
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const userIndex = users.findIndex(u => u.documentNumber === currentUser.documentNumber);
    
    if (userIndex >= 0) {
        // Guardar monto anterior para registro
        const previousAmount = users[userIndex].availableFunds || 0;
        
        // Actualizar monto
        users[userIndex].availableFunds = fundsToSet;
        localStorage.setItem("users", JSON.stringify(users));
        
        // Actualizar también en currentUser
        currentUser.availableFunds = fundsToSet;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        
        const message = `✅ Fondos actualizados correctamente:\n   Antes: ${formatCurrency(previousAmount)}\n   Ahora: ${formatCurrency(fundsToSet)}`;
        
        if (typeof window !== 'undefined') {
            window.alert(`Fondos actualizados a ${formatCurrency(fundsToSet)}`);
        }
        console.log(message);
        
        return true;
    }
    
    if (typeof window !== 'undefined') {
        window.alert('⚠️ Error: Usuario no encontrado');
    }
    console.error('❌ Error: Usuario no encontrado');
    return false;
}

/**
 * Formatea un valor monetario en formato COP
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
}

// Si estás ejecutando este script directamente, aplicar la configuración
if (typeof window !== 'undefined') {
    const result = setupTestEnvironment();
    if (result) {
        console.log('✅ Configuración aplicada. Recarga la página para ver los cambios.');
        
        // Sugerir al usuario recargar la página
        if (confirm('¿Deseas recargar la página ahora para ver los cambios?')) {
            window.location.reload();
        }
    }
}

// Crear una función auxiliar que se puede invocar desde la consola directamente
if (typeof window !== 'undefined') {
    window.setNeoBankFunds = (amount) => {
        const result = setupTestEnvironment(amount);
        if (result && confirm('¿Deseas recargar la página ahora para ver los cambios?')) {
            window.location.reload();
        }
    };
    console.log('💡 También puedes usar window.setNeoBankFunds(monto) para actualizar los fondos directamente.');
}

// Exportar funciones para uso en otros módulos
export {
    setupTestEnvironment,
    formatCurrency
};