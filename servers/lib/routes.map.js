
module.exports = {
    index: "index.html",
    // --------------------------------------------------------------------------------------
    statics: [
        {
            requireAuth: true,
            routes: [],
            file: "index"
        }
    ],

    // --------------------------------------------------------------------------------------
    apis: [
    // ---------------------------------------------------
    // Research
    // ---------------------------------------------------
        {
            basicAuth: { user: "glasslab", pass: "hz2M7V4fYb" },
            api: "/api/game/:gameId/events",
            service: "research",
            controller: "events",
            method: {
                get: "getEventsByDate"
            }
        },
        {
            basicAuth: { user: "glasslab", pass: "hz2M7V4fYb" },
            api: "/api/game/:gameId/parse-schema",
            service: "research",
            controller: "csv",
            method: {
                get: "getCsvParseSchema",
                post: "updateCsvParseSchema"
            }
        }
    ]

};