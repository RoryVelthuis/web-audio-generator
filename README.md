# Web Audio Generator

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)

## Introduction

This project is a web-based application that makes use of the Web Audio API to create and manipulate sound. This project aims to provide an easy-to-use interface for generating various types of audio signals and effects.

## Features

- **Waveform Generation**:
  - Generate different types of waveforms: sine, square, sawtooth, and triangle.

- **Frequency Control**:
  - Adjust the frequency using a range input and a number input.

- **Volume Control**:
  - Control the volume (gain) using a slider.

- **Note and Octave Selection**:
  - Select musical notes and octaves, with automatic frequency calculation.

- **Overtones**:
  - Enable or disable overtones.
  - Adjust the number of overtones.
  - Display and control individual overtone frequencies and gains.

- **Envelope Control**:
  - Control the attack, decay, sustain, and release (ADSR) envelope parameters.

- **User Interface**:
  - A user-friendly interface with sliders, checkboxes, and buttons to control audio parameters.


## Installation

To run this project locally, follow these steps:

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/web-audio-generator.git
    ```
2. Navigate to the project directory:
    ```sh
    cd web-audio-generator
    ```
3. Install the dependencies:
    ```sh
    npm install
    ```
4. Run the project locally:
    ```sh
    npm run dev
    ```
5. Open your browser and navigate to the provided local server address.

## Usage

Once you have the project open in your browser, you can start generating sound by selecting the waveform type and adjusting the parameters. The interface provides controls for frequency, waveform, and start/stop.
