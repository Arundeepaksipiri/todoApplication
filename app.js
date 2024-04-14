const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'todoApplication.db')
let db = null
const initializeDBAndServer = async () => {
  try {
    app.listen(3000, () => {
      console.log('Server starting http://localhost/3000/')
    })
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
  } catch (e) {
    console.log(`DB Error ${e.message}`)
  }
}

initializeDBAndServer()
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}
const hasPriorityProperties = requestQuery => {
  return requestQuery.priority !== undefined
}
const hasStatusProperties = requestQuery => {
  return requestQuery.status != undefined
}
app.get('/todos/', async (request, response) => {
  const {search_q = '', status, priority} = request.query
  let getTodosQuery = ''
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
    SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status = '${status}' AND priority='${priority}'`
      break
    case hasPriorityProperties(request.query):
      getTodosQuery = `
    SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND priority='${priority}'`
      break
    case hasStatusProperties(request.query):
      getTodosQuery = `
    SELECT * FROM todo WHERE todo LIKE '%${search_q}%' AND status='${status}'`
      break
    default:
      getTodosQuery = `
    SELECT * FROM todo WHERE todo LIKE '%${search_q}%'`
      break
  }

  const todoArray = await db.all(getTodosQuery)
  response.send(todoArray)
})
app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const todoQuery = `
  SELECT * FROM todo WHERE id=${todoId}`
  const todoArray = await db.get(todoQuery)
  response.send(todoArray)
})
app.post('/todos/', async (request, response) => {
  const todoDetails = request.body
  const {id, todo, priority, status} = todoDetails
  const todoQuery = `
  INSERT INTO todo (id,todo,priority,status) 
  VALUES(
    ${id},
    '${todo}',
    '${priority}',
    '${status}'
  )`
  await db.run(todoQuery)
  response.send('Todo Successfully Added')
})
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoDetails = request.body
  let todoColumn = ''
  switch (true) {
    case todoDetails.status !== undefined:
      todoColumn = 'Status'
      break
    case todoDetails.priority !== undefined:
      todoColumn = 'Priority'
      break
    case todoDetails.todo !== undefined:
      todoColumn = 'Todo'
  }
  const todoQuery = `
  SELECT * FROM todo WHERE id=${todoId}`
  const todoArray = await db.get(todoQuery)
  const {
    todo = todoArray.todo,
    priority = todoArray.priority,
    status = todoArray.status,
  } = request.body
  const newTodoQuery = `
  UPDATE todo
  SET
  todo='${todo}',
  priority='${priority}',
  status='${status}'
  WHERE id=${todoId}`
  await db.run(newTodoQuery)
  response.send(`${todoColumn} Updated`)
})
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const todoQuery = `
  DELETE FROM todo WHERE id=${todoId}`
  await db.run(todoQuery)
  response.send('Todo Deleted')
})

module.exports = app
