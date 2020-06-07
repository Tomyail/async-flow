import { buildFlow } from '../src/async-flow'
describe('async flow test', () => {
  it('works with one flow', () => {
    const flowConfig = {
      name: 'asyncTask1',
      flow: (context) => {
        return Promise.resolve(1)
      },
    }
    const asyncFlow = buildFlow({}, [flowConfig])

    asyncFlow.subscribe((context) => {
      expect(context).toEqual({
        asyncTask1: 1,
      })
    })
  })

  it('works with one flow with map', () => {
    const flowConfig = {
      name: 'asyncTask1',
      flow: (context) => {
        return Promise.resolve(1)
      },
      map: (result, context) => result + 100,
    }
    const asyncFlow = buildFlow({}, [flowConfig])

    asyncFlow.subscribe((context) => {
      expect(context).toEqual({
        asyncTask1: 101,
      })
    })
  })

  it('works with queue flow', () => {
    const asyncTask1 = {
      name: 'asyncTask1',
      flow: (context) => {
        return Promise.resolve('asyncTask1')
      },
    }

    const asyncTask2 = {
      name: 'asyncTask2',
      flow: (context) => {
        return Promise.resolve('asyncTask2' + context.asyncTask1)
      },
    }
    const asyncFlow = buildFlow({}, [asyncTask1, asyncTask2])

    asyncFlow.subscribe((context) => {
      expect(context).toEqual({ asyncTask1: 'asyncTask1', asyncTask2: 'asyncTask2asyncTask1' })
    })
  })

  it('works with parallel flow', () => {
    const asyncTask1 = {
      name: 'asyncTask1',
      flow: (context) => {
        return Promise.resolve('asyncTask1')
      },
    }

    const asyncTask2 = {
      name: 'asyncTask2',
      flow: (context) => {
        return Promise.resolve('asyncTask2' + context.asyncTask1)
      },
    }
    const asyncFlow = buildFlow({}, { asyncTask1, asyncTask2 })

    asyncFlow.subscribe((context) => {
      expect(context).toEqual({ asyncTask1: 'asyncTask1', asyncTask2: 'asyncTask2undefined' })
    })
  })

  it('works with children flow', () => {
    const asyncTask1 = {
      name: 'asyncTask1',
      flow: (context) => {
        return Promise.resolve('asyncTask1')
      },
      children: [
        {
          name: 'asyncTask1_child1',
          flow: (context) => {
            return Promise.resolve('this is asyncTask1_child1')
          },
        },
        {
          name: 'asyncTask1_child2',
          flow: (context) => {
            return Promise.resolve('this is asyncTask1_child2' + context.asyncTask1_child1)
          },
        },
      ],
    }

    const asyncTask2 = {
      name: 'asyncTask2',
      flow: (context) => {
        return Promise.resolve('asyncTask2' + context.asyncTask1)
      },
      children: {
        asyncTask2_child1: {
          name: 'asyncTask2_child1',
          flow: (context) => {
            return Promise.resolve('this is asyncTask2_child1')
          },
        },
        asyncTask2_child2: {
          name: 'asyncTask2_child2',
          flow: (context) => {
            return Promise.resolve('this is asyncTask2_child2' + context.asyncTask1_child1)
          },
        },
      },
    }
    const asyncFlow = buildFlow({}, { asyncTask1, asyncTask2 })

    asyncFlow.subscribe((context) => {
      expect(context).toEqual({
        asyncTask1: 'asyncTask1',
        asyncTask1_child1: 'this is asyncTask1_child1',
        asyncTask1_child2: 'this is asyncTask1_child2this is asyncTask1_child1',
        asyncTask2: 'asyncTask2undefined',
        asyncTask2_child1: 'this is asyncTask2_child1',
        asyncTask2_child2: 'this is asyncTask2_child2undefined',
      })
    })
  })

  it('works with nest flow', () => {
    const childFlowConfig = {
      name: 'childFlowConfig',
      flow: (context) => {
        return Promise.resolve(1)
      },
    }

    const childFlow = buildFlow({}, [childFlowConfig])

    const parentFlowConfig1 = {
      name: 'parentFlowConfig1',
      flow: (context) => {
        return childFlow
      },
    }

    const parentFlowConfig2 = {
      name: 'parentFlowConfig2',
      flow: (context) => {
        return Promise.resolve(2)
      },
    }

    const asyncFlow = buildFlow({}, [parentFlowConfig1, parentFlowConfig2])

    asyncFlow.subscribe((context) => {
      expect(context).toEqual({
        parentFlowConfig1: {
          childFlowConfig: 1,
        },
        parentFlowConfig2: 2,
      })
    })
  })
})
