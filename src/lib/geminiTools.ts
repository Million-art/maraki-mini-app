/**
 * Gemini Live API Custom Tool Definitions (Function Calling)
 */

export interface FunctionDeclaration {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export abstract class FunctionCallDefinition {
  public name: string;
  public description: string;
  public parameters: FunctionDeclaration['parameters'];
  public required: string[];

  constructor(
    name: string,
    description: string,
    parameters: FunctionDeclaration['parameters'],
    required: string[] = [],
  ) {
    this.name = name;
    this.description = description;
    this.parameters = parameters;
    this.required = required;
  }

  public getDeclaration(): FunctionDeclaration {
    return {
      name: this.name,
      description: this.description,
      parameters: {
        ...this.parameters,
        required: this.required,
      },
    };
  }

  abstract functionToCall(parameters: any): any;
}

/**
 * Show Alert Box Tool - Displays a browser alert dialog
 */
export class ShowAlertTool extends FunctionCallDefinition {
  constructor() {
    super(
      'show_alert',
      'Displays an alert dialog box with a message to the user',
      {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            description: 'The message to display in the alert box',
          },
          title: {
            type: 'string',
            description: 'Optional title prefix for the alert message',
          },
        },
      },
      ['message'],
    );
  }

  functionToCall(parameters: { message: string; title?: string }): { success: boolean; result: string } {
    const message = parameters.message || 'Alert!';
    const title = parameters.title;
    const fullMessage = title ? `${title}: ${message}` : message;

    alert(fullMessage);
    console.log(`🔔 Alert shown: ${fullMessage}`);
    return { success: true, result: `Alert shown to user: ${fullMessage}` };
  }
}

/**
 * Add CSS Style Tool - Injects CSS styles into the current web page
 */
export class AddCSSStyleTool extends FunctionCallDefinition {
  constructor() {
    super(
      'add_css_style',
      'Injects CSS styles into the current page with !important flag',
      {
        type: 'object',
        properties: {
          selector: {
            type: 'string',
            description: "CSS selector to target elements (e.g., 'body', '.class', '#id')",
          },
          property: {
            type: 'string',
            description: "CSS property to set (e.g., 'background-color', 'font-size', 'display')",
          },
          value: {
            type: 'string',
            description: "Value for the CSS property (e.g., 'red', '20px', 'none')",
          },
          styleId: {
            type: 'string',
            description: 'Optional ID for the style element (for updating existing styles)',
          },
        },
      },
      ['selector', 'property', 'value'],
    );
  }

  functionToCall(parameters: {
    selector: string;
    property: string;
    value: string;
    styleId?: string;
  }): { success: boolean; appliedElementsCount: number } {
    const { selector, property, value, styleId } = parameters;

    let styleElement: HTMLStyleElement | null = null;
    if (styleId) {
      styleElement = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
    } else {
      styleElement = document.createElement('style');
      document.head.appendChild(styleElement);
    }

    const cssRule = `${selector} { ${property}: ${value} !important; }\n`;

    if (styleId) {
      styleElement.textContent = cssRule;
    } else {
      styleElement.textContent += cssRule;
    }

    const count = document.querySelectorAll(selector).length;
    console.log(`🎨 CSS style injected: ${cssRule} (applied to ${count} element(s))`);
    return { success: true, appliedElementsCount: count };
  }
}

/**
 * Report Grammar Mistake Tool - Dispatches an event to correct user grammar in the UI
 */
export class ReportGrammarMistakeTool extends FunctionCallDefinition {
  constructor() {
    super(
      'report_grammar_mistake',
      'Reports a grammar, pronunciation, or phrasing mistake made by the user. Must be called before continuing the conversation.',
      {
        type: 'object',
        properties: {
          originalText: {
            type: 'string',
            description: 'The exact incorrect sentence or phrase the user spoke.',
          },
          correctedText: {
            type: 'string',
            description: 'The grammatically correct version of what the user said.',
          },
          mistakeType: {
            type: 'string',
            description: "A short classification of the mistake (e.g., 'Verb Tense', 'Pronunciation', 'Preposition').",
          },
          explanation: {
            type: 'string',
            description: 'A brief, friendly explanation of why it was wrong and how to fix it.',
          },
          nativeAlternative: {
            type: 'string',
            description: 'A natural, native-sounding alternative way to say the sentence.',
          },
        },
      },
      ['originalText', 'correctedText', 'mistakeType', 'explanation', 'nativeAlternative'],
    );
  }

  functionToCall(parameters: {
    originalText: string;
    correctedText: string;
    mistakeType: string;
    explanation: string;
    nativeAlternative: string;
  }): { success: boolean } {
    console.log(`📝 Grammar Mistake Detected:`, parameters);
    window.dispatchEvent(
      new CustomEvent('maraki_grammar_mistake', { detail: parameters })
    );
    return { success: true };
  }
}

// Global Registry of available custom tools for Gemini Live API
export const defaultGeminiTools: FunctionCallDefinition[] = [
  new ShowAlertTool(),
  new AddCSSStyleTool(),
  new ReportGrammarMistakeTool(),
];
