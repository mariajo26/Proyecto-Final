const EventEmitter = require('events');

// Clase personalizada para el manejo interno de eventos escolares
class SchoolEventBroker extends EventEmitter {}

// Crear una instancia única (Singleton) para toda la aplicación
const eventBroker = new SchoolEventBroker();

module.exports = eventBroker;
