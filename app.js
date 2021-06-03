const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format } = require("date-fns");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const statusList = ["TO DO", "IN PROGRESS", "DONE"];
const categoryList = ["WORK", "HOME", "LEARNING"];
const priorityList = ["HIGH", "MEDIUM", "LOW"];

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const getDateInformat = (dueDate) => {
  const newYears = new Date(dueDate);
  const formattedDate = format(newYears, "yyyy-MM-dd");
  return formattedDate;
};

const formatConverter = (todo) => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    category: todo.category,
    status: todo.status,
    dueDate: todo.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";

  const { search_q = "", priority, status, category } = request.query;

  if (status !== undefined && !statusList.includes(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  }

  if (priority !== undefined && !priorityList.includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }

  if (category !== undefined && !categoryList.includes(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  }

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        and priority = '${priority}';`;
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }

  data = await database.all(getTodosQuery);
  response.send(data.map((todo) => formatConverter(todo)));
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const sqlGetQur = `
    SELECT * FROM todo WHERE id=${todoId}`;
  data = await database.get(sqlGetQur);
  response.send(formatConverter(data));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  const formattedDate = getDateInformat(date);

  const sqlGetQur = `
        SELECT * FROM todo WHERE due_date="${formattedDate}"`;

  data = await database.all(sqlGetQur);
  response.send(data.map((todo) => formatConverter(todo)));
});

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  const formattedDate = getDateInformat(dueDate);

  if (!statusList.includes(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  }

  if (!priorityList.includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }

  if (!categoryList.includes(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  }
  const sqlGetQur = `
       INSERT INTO todo (id, todo, priority, status, category, due_date) VALUES
    (${id}, '${todo}', '${priority}', '${status}','${category}', '${formattedDate}' );`;

  await database.run(sqlGetQur);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  console.log(request.body);

  if (requestBody.status !== undefined && !statusList.includes(status)) {
    response.status(400);
    response.send("Invalid Todo Status");
  }

  if (requestBody.priority !== undefined && !priorityList.includes(priority)) {
    response.status(400);
    response.send("Invalid Todo Priority");
  }

  if (requestBody.category !== undefined && !categoryList.includes(category)) {
    response.status(400);
    response.send("Invalid Todo Category");
  }

  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  let formattedDate = previousTodo.due_date;

  if (updateColumn === "Due Date") {
    formattedDate = getDateInformat(response.body.dueDate);
  }

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = formattedDate,
  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}',
      category='${category}',
      due_date='${dueDate}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
