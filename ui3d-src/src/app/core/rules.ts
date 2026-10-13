import {State, Value} from '../models/device.types';

const tokenPattern = /\s*(\&\&|\|\||===|!==|==|!=|>=|<=|[()!<>]|-?\d+(?:\.\d+)?|true\b|false\b|[A-Za-z_][\w.]*)/gy;

export function evaluate(expression: string, state: State): boolean {
    if (expression.length > 2048) {
        throw new Error('Condition exceeds 2048 characters.');
    }
    const tokens: string[] = [];
    let offset = 0;
    while (offset < expression.trimEnd().length) {
        tokenPattern.lastIndex = offset;
        const match = tokenPattern.exec(expression);
        if (!match) {
            throw new Error(`Invalid condition near ${expression.slice(offset, offset + 20)}`);
        }
        tokens.push(match[1]);
        offset = tokenPattern.lastIndex;
    }
    let index = 0;
    let depth = 0;
    const atom = (): Value => {
        if (++depth > 64) {
            throw new Error('Condition is nested too deeply.');
        }
        const token = tokens[index++];
        let result: Value;
        if (token === '!') {
            result = !atom();
        } else if (token === '(') {
            result = or();
            if (tokens[index++] !== ')') {
                throw new Error('Missing closing parenthesis.');
            }
        } else if (token === 'true' || token === 'false') {
            result = token === 'true';
        } else if (token && /^-?\d/.test(token)) {
            result = Number(token);
        } else if (token && Object.hasOwn(state, token)) {
            result = state[token];
        } else {
            throw new Error(`Unknown condition state: ${token ?? '(empty)'}`);
        }
        depth--;
        return result;
    };
    const comparison = (): Value => {
        const left = atom();
        const operator = tokens[index];
        if (!['==', '===', '!=', '!==', '>', '<', '>=', '<='].includes(operator)) {
            return left;
        }
        index++;
        const right = atom();
        switch (operator) {
            case '==': case '===': return left === right;
            case '!=': case '!==': return left !== right;
            case '>': return left > right;
            case '<': return left < right;
            case '>=': return left >= right;
            default: return left <= right;
        }
    };
    const and = (): Value => {
        let value = comparison();
        while (tokens[index] === '&&') {
            index++;
            const right = comparison();
            value = Boolean(value) && Boolean(right);
        }
        return value;
    };
    const or = (): Value => {
        let value = and();
        while (tokens[index] === '||') {
            index++;
            const right = and();
            value = Boolean(value) || Boolean(right);
        }
        return value;
    };
    const result = or();
    if (index !== tokens.length) {
        throw new Error(`Unexpected condition token: ${tokens[index]}`);
    }
    return Boolean(result);
}
