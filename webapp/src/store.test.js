import { ActionsObservable } from "redux-observable"
import {
  configureStore,
  reducer,
  rootEpic,
  makeGetTasks,
  getTaskById,
  editTask,
  tasksReceived,
  reloadTasks,
  deleteTask,
  editNewTaskText
} from "./store"

describe("configureStore", () => {
  it("makes a store without a default state", () => {
    expect(configureStore().getState()).toBeTruthy()
  })
})

describe("selectors", () => {
  describe("getTaskById", () => {
    it("gets the task when it is there", () => {
      expect(
        getTaskById(
          {
            tasks: {
              items: {
                a: { _id: "a", isComplete: false, text: "foo" }
              }
            }
          },
          "a"
        )
      ).toEqual({ _id: "a", isComplete: false, text: "foo" })
    })

    it("returns undefined when there is no task", () => {
      expect(
        getTaskById(
          {
            tasks: {
              items: {}
            }
          },
          "a"
        )
      ).toBe(undefined)
    })
  })

  describe("getTasks", () => {
    const getTasks = makeGetTasks()

    it("gets a list from a loaded state in order", () => {
      expect(
        getTasks({
          tasks: {
            items: {
              a: { _id: "a", isComplete: false, text: "foo" },
              b: { _id: "b", isComplete: true, text: "bar" }
            }
          }
        })
      ).toEqual([
        { _id: "a", isComplete: false, text: "foo" },
        { _id: "b", isComplete: true, text: "bar" }
      ])
    })

    it("gets an empty list from an empty loaded state", () => {
      expect(
        getTasks({
          tasks: {
            items: {}
          }
        })
      ).toEqual([])
    })
  })
})

describe("reducer", () => {
  const initialState = {
    tasks: { status: "UNLOADED", items: {} }
  }

  const stateWithTaskA = {
    ...initialState,
    tasks: {
      status: "LOADED",
      items: {
        a: { _id: "a", isComplete: false, text: "foo" }
      },
      nextPageToken: "abc"
    }
  }

  it("ignores unknown actions", () => {
    expect(reducer(initialState, { type: "UNKNOWN" })).toEqual(initialState)
  })

  it("adds items on load", () => {
    const itemA = { _id: "a", isComplete: false, text: "foo" }
    const itemB = { _id: "b", isComplete: true, text: "bar" }
    const pageToken1 = "abc"
    const pageToken2 = null
    const stateAfterPage1 = {
      ...initialState,
      tasks: {
        status: "LOADED",
        items: {
          a: itemA
        },
        nextPageToken: pageToken1
      }
    }
    const stateAfterPage2 = {
      ...stateAfterPage1,
      tasks: {
        status: "LOADED",
        items: {
          a: itemA,
          b: itemB
        },
        nextPageToken: pageToken2
      }
    }

    expect(reducer(initialState, tasksReceived([itemA], pageToken1))).toEqual(
      stateAfterPage1
    )
    expect(
      reducer(stateAfterPage1, tasksReceived([itemB], pageToken2))
    ).toEqual(stateAfterPage2)
    expect(reducer(stateAfterPage2, tasksReceived([], pageToken2))).toEqual(
      stateAfterPage2
    )
  })

  it("removes all items on refresh", () => {
    expect(reducer(stateWithTaskA, reloadTasks())).toEqual({
      ...initialState,
      tasks: {
        status: "LOADING",
        items: {},
        nextPageToken: null
      }
    })
  })

  it("can edit the new task", () => {
    expect(
      reducer(
        {
          ...initialState,
          newTask: {
            text: "foo"
          }
        },
        editNewTaskText("bar")
      )
    ).toEqual({
      ...initialState,
      newTask: {
        text: "bar"
      }
    })
  })

  it("can edit tasks", () => {
    expect(
      reducer(stateWithTaskA, editTask("a", { isComplete: true }))
    ).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        items: {
          ...stateWithTaskA.tasks.items,
          a: { _id: "a", isComplete: true, text: "foo" }
        }
      }
    })
  })

  it("can delete tasks", () => {
    expect(reducer(stateWithTaskA, deleteTask("a"))).toEqual({
      ...stateWithTaskA,
      tasks: {
        ...stateWithTaskA.tasks,
        items: {}
      }
    })
  })
})

describe("rootEpic", () => {
  it("ignores unknown actions", () => {
    const subscriber = jest.fn()
    rootEpic(ActionsObservable.from([{ type: "UNKNOWN" }])).subscribe(
      subscriber
    )

    expect(subscriber).not.toBeCalled()
  })
})
