const express = require('express')
const app = express()
const exphbs = require('express-handlebars')
const conn = require('./db/conn')
const bcrypt = require('bcrypt')
const Produtos = require('./models/Produtos')
const Cliente = require('./models/Cliente')

const PORT = 3000
const hostname = 'localhost'

let log = false
let nome = ''
let adm = false


/* --------- Configuração do Express ----------- */
app.use(express.urlencoded({extended:true}))
app.use(express.json())
app.use(express.static('public'))
/* --------- configuração do Handlebars -------- */
app.engine('handlebars', exphbs.engine())
app.set('view engine', 'handlebars')
/* --------------------------------------------- */

app.post('/login', async (req,res)=>{
    const email = req.body.email
    const senha = req.body.senha
    console.log(email,senha)
    const pesq = await Cliente.findOne({raw:true, where:{email:email}})
    console.log(pesq)
    let msg = 'Usuário não Cadastrado'
    if(pesq == null){
        res.render('login', {log, nome, adm})
        
    }else{
        bcrypt.compare(senha, pesq.senha, (err,resultado)=>{
           if(err){
                console.error('Erro ao comparar a senha',err)
                res.render('home', {log, nome, adm})
           }else if(resultado){
            console.log('Cliente existente')
            if(pesq.tipo === 'admin'){
                log = true
                nome = pesq.nome
                adm = true
                console.log(adm)
                res.render('gerenciador', {log, nome, adm})        
            }else if(pesq.tipo === 'cliente'){
                log = true
                nome = pesq.nome
                adm = false
                console.log(nome)
                res.render('home', {log, nome, adm})
           }
           }else{
            console.log('senha incorreta')
            res.render('home', {log, nome, adm})
           }
        })
    }
})

app.get('/login', (req,res)=>{
    log = false
    nome = ''
    res.render('login', {log, nome, adm})
})

app.get('/logout', (req,res)=>{
    log = false
    usuario = ''
    res.render('home', {log, usuario, adm})
})

//---------------------------------------------------------------------------------------------------------//
app.post('/comprar', async (req,res)=>{
    const dados_carrinho = req.body
    console.log(dados_carrinho)

    const atualiza_promise = []

    for (const item of dados_carrinho){
        const produto = await Produtos.findByPk(item.cod_prod, {raw: true})
        console.log(produto)
        if(!produto || produto.quantidade < item.qtde){
           return  res.status(400).json({message: "produto insuficiente ou não disponível" + produto.quantidade})
        }

        const atualiza_promessas = await Produtos.update(
            { quantidade: produto.quantidade - item.qtde},
            {where: { id: item.cod_prod}}
        )
        atualiza_promise.push(atualiza_promessas)
    }

    try{
        await Promise.all(atualiza_promise)
        res.status(200).json({message: "compra realizada com sucesso!"})
    }catch(error){
        console.error("Erro ao atualizar os dados"+error)
        res.status(500).json({message: "Erro ao processar a compra"})
    }
})

app.get('/carrinho', (req,res)=>{
    res.render('carrinho', {log, nome, adm})
})
//---------------------------------------------------------------------------------------------------------//
app.post('/cadastro', async(req,res)=>{
    const nome = req.body.nome
    const email = req.body.email
    const senha = req.body.senha
    const tipo = 'cliente'

    console.log(nome,email,senha)

    bcrypt.hash(senha, 10, async (err,hash)=>{
        if(err){
            console.error('Erro ao criar o hash da senha'+err)
            res.render('home', {log, nome, adm})
            return
        }
        try{
            await Cliente.create({nome:nome, email: email,senha: hash, tipo:tipo})
            console.log('\n')
            console.log('Senha criptografada')
            console.log('\n')

            log = true

            const pesq = await Cliente.findOne({ raw: true, where:{ nome:nome, senha: hash}})
            console.log(pesq)

            res.render('home', {log, nome, adm})
        }catch(error){
            console.error('Erro ao criar a senha',error)
            res.render('home', {log, nome, adm})
        }
    })
})

app.get('/cadastro', (req,res)=>{
    res.render('cadastro', {log, nome, adm})
})

app.get('/Produtos', (req,res)=>{
    res.render('produtos', {log, nome, adm})
})

//-----------------coisas de gerente-----------------//

app.post('/apagarProduto', async(req,res)=>{
    const id = req.body.id
    const msg = 'Dados Apagados'
    const msgB = 'Erro ao apagar'
    const pesq = await Produtos.findOne({raw:true, where:{id:id}})
    if(pesq != null){
        await Produtos.destroy({where:{id:id}})
        res.render('apagarProduto', {log, nome, adm, msg})
    }else{
        res.render('apagarProduto', {log, nome, adm, msgB})
    }
})

app.post('/consultaBProduto', async (req, res)=>{
    const nome_carro = req.body.nome_carro
    console.log(nome_carro)
    const dados = await Produtos.findOne({raw:true, where: {nome_carro:nome_carro}})
    console.log(dados)
    res.render('apagarProduto',{log, nome, adm, valor:dados} )
})

app.get('/apagarProduto', (req,res)=>{
    res.render('apagarProduto', {log, nome, adm})
})

//-----------------------------------------------------------//

app.post('/cadastrarProduto', async (req,res)=>{
    const nome_carro = req.body.nome_carro
    const cor_carro = req.body.cor_carro
    const quantidade = req.body.quantidade
    const precoUnitario = req.body.precoUnitario
    console.log(nome_carro, cor_carro, quantidade, precoUnitario)
    let msg = 'Dados Cadastrados'
    if((quantidade != '')&&(precoUnitario != '')){
        await Produtos.create({nome_carro:nome_carro, cor_carro: cor_carro, quantidade:quantidade, precoUnitario: precoUnitario})
        res.render('cadastrarProduto', {log, nome, adm, msg})
    }else{
        res.render('cadastrarProduto', {log, nome, adm, msgB})
    }
})

app.get('/cadastrarProduto', (req,res)=>{
    res.render('cadastrarProduto', {log, nome, adm})
})

app.post('/atualizarProduto', async (req,res)=>{
    const id = req.body.id
    const nome_carro = req.body.nome_carro
    const cor_carro = req.body.cor_carro
    const quantidade = Number(req.body.quantidade)
    const precoUnitario = Number(req.body.precoUnitario)
    console.log(id, nome_carro, cor_carro, quantidade, precoUnitario)
    const pesq = await Produtos.findOne({raw:true, where: {id:id}})
    const dados = {
        nome_carro:nome_carro,
        cor_carro:cor_carro,
        quantidade:quantidade,
        precoUnitario:precoUnitario
    }
    const msg = 'Dados Alterados'
    const msgB = 'Erro'
    console.log(dados)
    if(pesq != null){
        await Produtos.update(dados, {where:{id:id}})
        res.render('atualizarProduto', {log, nome, adm, msg})
    }else{
        res.render('atualizarProduto', {log, nome, adm, msgB})
    }
})

app.post('/consultaProduto', async (req, res)=>{
    const nome_carro = req.body.nome_carro
    console.log(nome_carro)
    const dados = await Produtos.findOne({raw:true, where: {nome_carro:nome_carro}})
    console.log(dados)
    res.render('atualizarProduto',{log, nome, adm, valor:dados} )
})

app.get('/atualizarProduto', (req,res)=>{
    res.render('atualizarProduto', {log, nome, adm})
})

//-----------------------------------------------------------//

app.get('/listarProduto', async (req,res)=>{
    const dados = await Produtos.findAll({raw:true})
    console.log(dados)
    res.render('listarProduto', {log, nome, adm, valores:dados})
})

app.get('/gerenciador', (req,res)=>{
    res.render('gerenciador', {log, nome, adm})    
})

//------------------------------------------------//
app.get('/', (req,res)=>{
    res.render('home', {log, nome, adm})
})
/*----------------------------------------------*/
conn.sync().then(()=>{
    app.listen(PORT,hostname,()=>{
        console.log(`Servidor rodando ${hostname}:${PORT}`)
    })
}).catch((error)=>{
    console.error('Erro de conexão com o Banco de dados '+ error)
})