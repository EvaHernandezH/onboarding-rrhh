const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'onboarding.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error al conectar con SQLite:', err.message);
    } else {
        console.log('Conectado a la base de datos SQLite.');
        db.run(`
            CREATE TABLE IF NOT EXISTS candidatos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                datos_postulante TEXT NOT NULL,
                fuente TEXT,
                sede TEXT,
                condicion TEXT,
                prueba_manejo TEXT,
                estado TEXT NOT NULL,
                sub_estado TEXT,
                fecha_estado TEXT,
                responsable TEXT,
                observacion TEXT
            )
        `, (err) => {
            if (err) {
                console.error("Error al crear la tabla:", err.message);
            } else {
                console.log("Tabla 'candidatos' lista.");
                
                db.run(`
                    CREATE TABLE IF NOT EXISTS historial_candidatos (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        candidato_id INTEGER,
                        estado TEXT,
                        sub_estado TEXT,
                        responsable TEXT,
                        observacion TEXT,
                        fecha_estado TEXT,
                        fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(candidato_id) REFERENCES candidatos(id) ON DELETE CASCADE
                    )
                `, (err2) => {
                    if (err2) console.error("Error al crear historial:", err2.message);
                    else console.log("Tabla 'historial_candidatos' lista.");
                });
            }
        });
    }
});

module.exports = db;
