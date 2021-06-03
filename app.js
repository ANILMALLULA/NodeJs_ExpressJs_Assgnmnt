const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const { format } = require("date-fns");
const { isValid, parse } = require("date-fns");

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

    app.listen(8000, () =>
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
  const formattedDate = format(dueDate, "yyyy-MM-dd");
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

const formatConverter2 = (todo) => {
  return {
    id: todo.id,
    todo: todo.todo,
    priority: todo.priority,
    status: todo.status,
    category: todo.category,
    dueDate: todo.due_date,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  let isValid = true;

  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      if (statusList.includes(status) && priorityList.includes(priority)) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      } else {
        isValid = false;
      }
      break;

    case hasCategoryAndStatusProperties(request.query):
      if (categoryList.includes(category) && statusList.includes(status)) {
        getTodosQuery = `
        SELECT
          *
        FROM
          todo 
        WHERE
          todo LIKE '%${search_q}%'
          AND status = '${status}'
          AND category = '${category}';`;
      } else {
        isValid = false;
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      if (categoryList.includes(category) && priorityList.includes(priority)) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}'
        and priority = '${priority}';`;
      } else {
        isValid = false;
      }

      break;
    case hasPriorityProperty(request.query):
      if (priorityList.includes(priority)) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      } else {
        isValid = false;
      }

      break;
    case hasStatusProperty(request.query):
      if (statusList.includes(status)) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      } else {
        isValid = false;
      }
      break;

    case hasCategoryProperty(request.query):
      if (categoryList.includes(category)) {
        getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
        break;
      } else {
        isValid = false;
      }

    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
  }
  if (isValid) {
    data = await database.all(getTodosQuery);
    response.send(data.map((todo) => formatConverter(todo)));
  } else {
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
  }
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
  const validate1 = parse(date, "yyyy-MM-dd", new Date());

  if (isValid(validate1)) {
    const formattedDate = getDateInformat(validate1);

    console.log(formattedDate);

    const sqlGetQur = `
        SELECT * FROM todo WHERE due_date="${formattedDate}"`;

    data = await database.all(sqlGetQur);
    response.send(data.map((todo) => formatConverter2(todo)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
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

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  console.log(request);
  const validate1 = parse(dueDate, "yyyy-MM-dd", new Date());

  if (
    isValid(validate1) &&
    statusList.includes(status) &&
    priorityList.includes(priority) &&
    categoryList.includes(category)
  ) {
    const formattedDate = getDateInformat(dueDate);
    const sqlGetQur = `
       INSERT INTO todo (id, todo, priority, status, category, due_date) VALUES
    (${id}, '${todo}', '${priority}', '${status}','${category}', '${formattedDate}' );`;

    await database.run(sqlGetQur);
    response.send("Todo Successfully Added");
  } else {
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
    if (!isValid(validate1)) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;

  let isValidReq = true;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      if (!statusList.includes(requestBody.status)) {
        isValidReq = false;
      }
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      if (!priorityList.includes(requestBody.priority)) {
        isValidReq = false;
      }
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
    case requestBody.category !== undefined:
      updateColumn = "Category";
      if (!categoryList.includes(requestBody.category)) {
        isValidReq = false;
      }
      break;
    case requestBody.dueDate !== undefined:
      updateColumn = "Due Date";

      const validate1 = parse(requestBody.dueDate, "yyyy-MM-dd", new Date());
      console.log(isValid(validate1));
      if (!isValid(validate1)) {
        isValidReq = false;
      }
      break;
  }

  if (isValidReq) {
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
      console.log("yes --", formattedDate);
      formattedDate = format(parseISO(requestBody.dueDate), "yyyy-MM-dd");
      console.log("no --", formattedDate);
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
  } else {
    if (updateColumn === "Status") {
      response.status(400);
      response.send("Invalid Todo Status");
    }

    if (updateColumn === "Priority") {
      response.status(400);
      response.send("Invalid Todo Priority");
    }

    if (updateColumn === "Category") {
      response.status(400);
      response.send("Invalid Todo Category");
    }

    if (updateColumn === "Due Date") {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

module.exports = app;
