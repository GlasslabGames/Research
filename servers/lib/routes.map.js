
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
            api: "/research/events/get",
            service: "research",
            controller: "events",
            method: {
                get: "getEventsByDate"
            }
        }
    ]

};