const { Sequelize } = require('sequelize')
const sequelize = new Sequelize('db_palald', 'root', 'senai', {
    host: 'localhost',
    dialect: 'mysql'
})

// sequelize.authenticate().then(()=>{
//     console.log('Conexão com sucesso!')
// }).catch((error)=>{
//     console.error('Erro de conexão'+error)
// })

module.exports = sequelize