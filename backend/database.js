const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool(process.env.DATABASE_URL);

// Probar la conexión e inicializar tablas
async function initDb() {
    let retries = 100;
    while (retries > 0) {
        try {
            const connection = await pool.getConnection();
            console.log('¡Conectado a la base de datos MySQL en Aiven!');
            
            await connection.query(`
                CREATE TABLE IF NOT EXISTS candidatos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    datos_postulante VARCHAR(255),
                    fuente VARCHAR(100),
                    sede VARCHAR(100),
                    condicion VARCHAR(10),
                    prueba_manejo VARCHAR(20),
                    estado VARCHAR(50),
                    sub_estado VARCHAR(100),
                    fecha_estado DATE,
                    responsable VARCHAR(100),
                    observacion TEXT
                )
            `);
            console.log('Tabla "candidatos" lista.');

            await connection.query(`
                CREATE TABLE IF NOT EXISTS historial_candidatos (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    candidato_id INT,
                    estado VARCHAR(50),
                    sub_estado VARCHAR(100),
                    responsable VARCHAR(100),
                    observacion TEXT,
                    fecha_estado DATE,
                    FOREIGN KEY(candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE
                )
            `);
            console.log('Tabla "historial_candidatos" lista.');
            
            connection.release();
            break; // Si tiene éxito, salir del bucle
        } catch (error) {
            console.error('La base de datos aún no está lista, reintentando en 10 segundos...', error.message);
            retries--;
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
    }
}

initDb();

module.exports = pool;
