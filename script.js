(function () {
  'use strict';

  const display = document.getElementById('display');
  const expression = document.getElementById('expression');

  let currentInput = '0';
  let previousValue = null;
  let operator = null;
  let shouldResetInput = false;
  let lastEquals = false;
  let lastOperator = null;
  let lastOperand = null;

  const MAX_DIGITS = 12;

  const opSymbols = {
    '/': '\u00F7',
    '*': '\u00D7',
    '-': '\u2212',
    '+': '+'
  };

  function formatNumber(num) {
    if (num === 'Error') return 'Error';
    const n = parseFloat(num);
    if (isNaN(n)) return '0';
    if (!isFinite(n)) return 'Error';
    const str = String(n);
    if (str.includes('e')) return n.toExponential(6);
    if (str.replace('-', '').replace('.', '').length > MAX_DIGITS) {
      return parseFloat(n.toPrecision(MAX_DIGITS)).toString();
    }
    return str;
  }

  function updateDisplay() {
    const formatted = currentInput === 'Error' ? 'Error' : currentInput;
    display.textContent = formatted;
    display.classList.toggle('shrink', formatted.length > 10);
  }

  function updateExpression(text) {
    expression.textContent = text || '';
  }

  function calculate(a, op, b) {
    const left = parseFloat(a);
    const right = parseFloat(b);
    if (isNaN(left) || isNaN(right)) return 'Error';
    switch (op) {
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return right === 0 ? 'Error' : left / right;
      default: return right;
    }
  }

  function handleDigit(digit) {
    if (currentInput === 'Error') {
      currentInput = digit;
      updateDisplay();
      return;
    }
    if (lastEquals) {
      previousValue = null;
      operator = null;
      lastEquals = false;
      updateExpression('');
    }
    if (shouldResetInput) {
      currentInput = digit;
      shouldResetInput = false;
    } else {
      const raw = currentInput.replace('-', '').replace('.', '');
      if (raw.length >= MAX_DIGITS) return;
      currentInput = currentInput === '0' ? digit : currentInput + digit;
    }
    updateDisplay();
  }

  function handleDecimal() {
    if (currentInput === 'Error') {
      currentInput = '0.';
      updateDisplay();
      return;
    }
    if (lastEquals) {
      previousValue = null;
      operator = null;
      lastEquals = false;
      updateExpression('');
      currentInput = '0.';
      updateDisplay();
      return;
    }
    if (shouldResetInput) {
      currentInput = '0.';
      shouldResetInput = false;
    } else if (!currentInput.includes('.')) {
      currentInput += '.';
    }
    updateDisplay();
  }

  function handleOperator(op) {
    if (currentInput === 'Error') return;
    lastEquals = false;
    clearActiveOp();

    if (operator && !shouldResetInput) {
      const result = calculate(previousValue, operator, currentInput);
      const formatted = formatNumber(result);
      updateExpression(formatted + ' ' + opSymbols[op]);
      previousValue = formatted;
      currentInput = formatted;
    } else {
      previousValue = currentInput;
      updateExpression(currentInput + ' ' + opSymbols[op]);
    }

    operator = op;
    shouldResetInput = true;
    updateDisplay();
    setActiveOp(op);
  }

  function handleEquals() {
    if (currentInput === 'Error') return;
    clearActiveOp();

    if (lastEquals && lastOperator) {
      const result = calculate(currentInput, lastOperator, lastOperand);
      const formatted = formatNumber(result);
      updateExpression(currentInput + ' ' + opSymbols[lastOperator] + ' ' + lastOperand + ' =');
      currentInput = formatted;
      updateDisplay();
      return;
    }

    if (operator === null) {
      updateExpression(currentInput + ' =');
      lastEquals = true;
      return;
    }

    const result = calculate(previousValue, operator, currentInput);
    const formatted = formatNumber(result);
    updateExpression(previousValue + ' ' + opSymbols[operator] + ' ' + currentInput + ' =');
    lastOperator = operator;
    lastOperand = currentInput;
    currentInput = formatted;
    previousValue = null;
    operator = null;
    shouldResetInput = true;
    lastEquals = true;
    updateDisplay();
  }

  function handleClear() {
    currentInput = '0';
    previousValue = null;
    operator = null;
    shouldResetInput = false;
    lastEquals = false;
    lastOperator = null;
    lastOperand = null;
    clearActiveOp();
    updateDisplay();
    updateExpression('');
  }

  function handleToggleSign() {
    if (currentInput === 'Error' || currentInput === '0') return;
    currentInput = currentInput.startsWith('-')
      ? currentInput.slice(1)
      : '-' + currentInput;
    updateDisplay();
  }

  function handlePercent() {
    if (currentInput === 'Error') return;
    const n = parseFloat(currentInput);
    if (isNaN(n)) return;
    currentInput = formatNumber(n / 100);
    updateDisplay();
  }

  function setActiveOp(op) {
    document.querySelectorAll('.btn.op').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.value === op);
    });
  }

  function clearActiveOp() {
    document.querySelectorAll('.btn.op.active').forEach(function (btn) {
      btn.classList.remove('active');
    });
  }

  // Button clicks
  document.querySelector('.buttons').addEventListener('click', function (e) {
    const btn = e.target.closest('.btn');
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case 'digit': handleDigit(btn.dataset.value); break;
      case 'decimal': handleDecimal(); break;
      case 'operator': handleOperator(btn.dataset.value); break;
      case 'equals': handleEquals(); break;
      case 'clear': handleClear(); break;
      case 'toggle-sign': handleToggleSign(); break;
      case 'percent': handlePercent(); break;
    }
  });

  // Keyboard support
  document.addEventListener('keydown', function (e) {
    if (e.key >= '0' && e.key <= '9') handleDigit(e.key);
    else if (e.key === '.') handleDecimal();
    else if (e.key === '+') handleOperator('+');
    else if (e.key === '-') handleOperator('-');
    else if (e.key === '*') handleOperator('*');
    else if (e.key === '/') { e.preventDefault(); handleOperator('/'); }
    else if (e.key === 'Enter' || e.key === '=') handleEquals();
    else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') handleClear();
    else if (e.key === '%') handlePercent();
    else if (e.key === 'Backspace') {
      if (currentInput.length > 1) {
        currentInput = currentInput.slice(0, -1);
      } else {
        currentInput = '0';
      }
      updateDisplay();
    }
  });

  updateDisplay();
})();
