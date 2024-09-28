class BitcrusherProcessor extends AudioWorkletProcessor {
    static get parameterDescriptors() {
        return [
            { name: 'bitDepth', defaultValue: 8, minValue: 1, maxValue: 16 },
            { name: 'sampleRateReduction', defaultValue: 4, minValue: 1, maxValue: 16 }
        ];
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        const output = outputs[0];
        const bitDepth = parameters.bitDepth[0];
        const sampleRateReduction = parameters.sampleRateReduction[0];

        if (input.length > 0) {
            const inputChannel = input[0];
            const outputChannel = output[0];
            const step = Math.pow(0.5, bitDepth);

            for (let i = 0; i < inputChannel.length; i++) {
                if (i % sampleRateReduction === 0) {
                    outputChannel[i] = step * Math.floor(inputChannel[i] / step + 0.5);
                } else {
                    outputChannel[i] = outputChannel[i - 1];
                }
            }
        }

        return true;
    }
}

registerProcessor('bitcrusher-processor', BitcrusherProcessor);