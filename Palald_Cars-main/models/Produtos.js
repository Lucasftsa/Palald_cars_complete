const { DataTypes } = require('sequelize')
const db = require('../db/conn')
const Produtos = db.define('produtos',{

    nome_carro: {
        type: DataTypes.STRING(30)
    },

    cor_carro: {
        type: DataTypes.STRING(30)
    },

    quantidade: {
        type: DataTypes.STRING(30)
    },

    precoUnitario: {
        type: DataTypes.STRING(30)
    }



},{
    createdAt: false,
    updatedAt: false
})

// Produtos.sync({force:true})

module.exports = Produtos