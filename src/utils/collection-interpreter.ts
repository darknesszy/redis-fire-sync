export const interpret = (input: string) => input.split(',').map(el => {
    const variables = el.split(':')
    if (variables.length == 2) {
        const withCondition = variables[1].split('->')
        return {
            name: variables[0],
            indexKey: withCondition.length == 2 ? withCondition[1] : variables[1],
            condition: withCondition.length == 2 ? withCondition[0] : undefined
        }
    } else {
        return { name: el }
    }
})