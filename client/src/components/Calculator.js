import React from 'react';
import PointTarget from "react-point";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

class AutoScalingText extends React.Component {
    state = {
        scale: 1
    };
    componentDidUpdate() {
        const { scale } = this.state

        const node = this.node
        const parentNode = node.parentNode

        const availableWidth = parentNode.offsetWidth
        const actualWidth = node.offsetWidth
        const actualScale = availableWidth / actualWidth

        if (scale === actualScale)
            return

        if (actualScale < 1) {
            this.setState({ scale: actualScale })
        } else if (scale < 1) {
            this.setState({ scale: 1 })
        }
    }
    render() {
        const { scale } = this.state

        return (
            <div
                className="auto-scaling-text"
                style={{ transform: `scale(${scale},${scale})` }}
                ref={node => this.node = node}
                >{this.props.children}</div>
                )
    }
}
class CalculatorDisplay extends React.Component {
    render() {
        const { value, ...props } = this.props
        return (
            <div {...props} className="calculator-display">
                <AutoScalingText>{value}</AutoScalingText>
            </div>
            )
    }
}
class Key extends React.Component {
    render() {
        const { onPress, className, ...props } = this.props

        return (
            <PointTarget onPoint={onPress}>
                <button className={`calculator-key ${className}`} {...props}/>
            </PointTarget>
            )
    }
}
class Calculator extends React.Component {
    state = {
        value: null,
        displayValue: '',
        stack: []
    };
    
    postCalculate = async (data) => {
        try {
            const response = await fetch('http://localhost:8000/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                toast.error(`Error HTTP status: ${response.status}`)
                return
            }

            const result = await response.json();
            return result;
        } catch (error) {
            toast.error(`L'API a retourné une erreur. ${error.toString()}`)
            return
        }
    };

    clearAll() {
        this.setState({
            value: null,
            displayValue: '',
            stack: []
        })
    }

    clearDisplay() {
        this.setState({
            displayValue: ''
        })
    }

    clearLastChar() {
        const { displayValue } = this.state

        this.setState({
            displayValue: (displayValue + ''||'').substring(0, displayValue.length - 1) || ''
        })
    }

    toggleSign() {
        const { displayValue } = this.state
        const parts = displayValue.split(' ')
        const oldValue = parts?.pop() || null
        
        if( oldValue && +oldValue*1==+oldValue ){
            this.setState({
                displayValue: parts.join(' ') + " " + oldValue * -1
            })
        }
    }

    inputSpace() {
        const { displayValue } = this.state

        this.setState({
            displayValue: String(displayValue + " ")
        })
    }

    inputDot() {
        const { displayValue } = this.state

        if (!(/\./).test(displayValue)) {
            this.setState({
                displayValue: displayValue + '.'
            })
        }
    }

    inputDigit(digit) {
        const { displayValue, waitingForOperand } = this.state

        if (waitingForOperand) {
            this.setState({
                displayValue: String(digit),
                waitingForOperand: false
            })
        } else {
            this.setState({
                displayValue: displayValue === '0' ? String(digit) : displayValue + digit
            })
        }
    }

    inputSign(sign) {
        const { displayValue, stack } = this.state
        
        if( displayValue === "" && !stack.length )
            return

        this.setState({
            displayValue: displayValue + " " + sign + " "
        })
    }

    async performOperation(nextOperator) {    
        const { displayValue: expression, stack } = this.state
        
        try{
            const { result_number, result_stack } = await this.postCalculate({
                expression, stack
            });
            
            this.setState({
                displayValue: result_number,
                stack: result_stack
            })
        }catch(e){
            toast.info(e.message)
        }
    }

    handleKeyDown = (event) => {
        let { key } = event

        if (key === 'Enter')
            key = '='

        if ((/\d/).test(key)) {
            event.preventDefault()
            this.inputDigit(parseInt(key, 10))
        } else if ([ "+", "-", "*", "/", "^", "%" ].includes(key)) {
            event.preventDefault()
            this.inputSign(key)
        } else if (key === '.') {
            event.preventDefault()
            this.inputDot()
        } else if (key === 'Space' || key === " ") {
            event.preventDefault()
            this.inputSpace()
        } else if (key === 'Backspace') {
            event.preventDefault()
            this.clearLastChar()
        } else if (key === '=') {
            event.preventDefault()
            this.performOperation()
        } else if (key === 'Clear') {
            event.preventDefault()

            if (this.state.displayValue !== '0') {
                this.clearDisplay()
            } else {
                this.clearAll()
            }
        }
    };
    
    handlePaste = ( event ) => {
        const clipboardData = event.clipboardData || event.clipboardData
        const pastedData = clipboardData.getData('Text')
        this.setState({
            displayValue: pastedData,
            stack: []
        })
    }
    
    handleDownload = async () => {
        try {
            const response = await fetch('http://localhost:8000/export');

            if (!response.ok) {
                toast.error(`Erreur HTTP: ${response.status}`)
                return
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'calculations.csv';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            toast.error(`Download error:: ${error.toString()}`)
            return
        }
    }

    useExample = () => {
        const examples = [
            "5 4 %",
            "15 7 1 1 + - / 3 * 2 1 1 + + -",
            "343 45 * 12 /",
            "343 45 + 12 /",
            "3 4 5 + *"
        ]
        this.setState({
            displayValue: examples[Math.floor(Math.random() * examples.length)],
            stack: []
        })
    }
    
    componentDidMount() {
        document.addEventListener('keydown', this.handleKeyDown)
        document.addEventListener('paste', this.handlePaste)
    }

    componentWillUnmount() {
        document.removeEventListener('keydown', this.handleKeyDown)
        document.addEventListener('paste', this.handlePaste)
    }

    render() {
        const { displayValue } = this.state

        const clearDisplay = displayValue !== ''
        const clearText = clearDisplay ? 'C' : 'AC'

        return (
            <div className="calculator">
                <CalculatorDisplay value={displayValue}/>
                <div className="calculator-keypad">
                    <div className="input-keys">
                        <div className="function-keys">
                            <Key className="key-download" onPress={() => this.handleDownload()}>download</Key>
                            <Key className="key-example" onPress={() => this.useExample()}>example</Key>
                            <Key className="key-mod" onPress={() => this.inputSign('%')}>%</Key>
                        </div>
                        <div className="function-keys">
                            <Key className="key-clear" onPress={() => clearDisplay ? this.clearLastChar() : this.clearAll()}>{clearText}</Key>
                            <Key className="key-sign" onPress={() => this.toggleSign()}>±</Key>
                            <Key className="key-space" onPress={() => this.inputSpace()}>space</Key>
                        </div>
                        <div className="digit-keys">
                            <Key className="key-0" onPress={() => this.inputDigit(0)}>0</Key>
                            <Key className="key-dot" onPress={() => this.inputDot()}>●</Key>
                            <Key className="key-1" onPress={() => this.inputDigit(1)}>1</Key>
                            <Key className="key-2" onPress={() => this.inputDigit(2)}>2</Key>
                            <Key className="key-3" onPress={() => this.inputDigit(3)}>3</Key>
                            <Key className="key-4" onPress={() => this.inputDigit(4)}>4</Key>
                            <Key className="key-5" onPress={() => this.inputDigit(5)}>5</Key>
                            <Key className="key-6" onPress={() => this.inputDigit(6)}>6</Key>
                            <Key className="key-7" onPress={() => this.inputDigit(7)}>7</Key>
                            <Key className="key-8" onPress={() => this.inputDigit(8)}>8</Key>
                            <Key className="key-9" onPress={() => this.inputDigit(9)}>9</Key>
                        </div>
                    </div>
                    <div className="operator-keys">
                        <Key className="key-pow" onPress={() => this.inputSign('^')}>^</Key>
                        <Key className="key-divide" onPress={() => this.inputSign('/')}>÷</Key>
                        <Key className="key-multiply" onPress={() => this.inputSign('*')}>×</Key>
                        <Key className="key-subtract" onPress={() => this.inputSign('-')}>−</Key>
                        <Key className="key-add" onPress={() => this.inputSign('+')}>+</Key>
                        <Key className="key-equals" onPress={() => this.performOperation('=')}>=</Key>
                    </div>
                </div>
                <ToastContainer />
            </div>
            )
    }
}

export default Calculator;