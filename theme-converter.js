#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

/**
 * Theme Converter Utility
 * Converts VSCode themes to Warp Terminal and Zed Editor formats
 */

class ThemeConverter {
    constructor() {
        this.supportedFormats = ['warp', 'zed'];
    }

    /**
     * Main conversion function
     * @param {string} inputPath - Path to VSCode theme file
     * @param {string} format - Target format ('warp' or 'zed')
     * @param {string} outputPath - Optional output path
     */
    convert(inputPath, format, outputPath = null) {
        if (!this.supportedFormats.includes(format)) {
            throw new Error(`Unsupported format: ${format}. Supported: ${this.supportedFormats.join(', ')}`);
        }

        const vscodeTheme = this.loadVSCodeTheme(inputPath);
        const convertedTheme = this[`convertTo${format.charAt(0).toUpperCase() + format.slice(1)}`](vscodeTheme);
        
        if (outputPath) {
            this.saveTheme(convertedTheme, outputPath, format);
        }
        
        return convertedTheme;
    }

    /**
     * Load and parse VSCode theme file
     */
    loadVSCodeTheme(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to load VSCode theme: ${error.message}`);
        }
    }

    /**
     * Convert VSCode theme to Warp format
     */
    convertToWarp(vscodeTheme) {
        const colors = vscodeTheme.colors || {};
        
        // Determine details value based on theme type
        let details = 'darker';
        if (vscodeTheme.type === 'light') {
            details = 'lighter';
        } else if (vscodeTheme.type === 'dark') {
            details = 'darker';
        }
        
        return {
            accent: this.extractAccentColor(colors),
            background: colors['editor.background'] || colors['terminal.background'] || '#000000',
            details: details,
            foreground: colors['editor.foreground'] || colors['terminal.foreground'] || '#ffffff',
            terminal_colors: {
                bright: {
                    black: colors['terminal.ansiBrightBlack'] || colors['terminal.ansiBlack'] || '#808080',
                    blue: colors['terminal.ansiBrightBlue'] || colors['terminal.ansiBlue'] || '#8080ff',
                    cyan: colors['terminal.ansiBrightCyan'] || colors['terminal.ansiCyan'] || '#80ffff',
                    green: colors['terminal.ansiBrightGreen'] || colors['terminal.ansiGreen'] || '#80ff80',
                    magenta: colors['terminal.ansiBrightMagenta'] || colors['terminal.ansiMagenta'] || '#ff80ff',
                    red: colors['terminal.ansiBrightRed'] || colors['terminal.ansiRed'] || '#ff8080',
                    white: colors['terminal.ansiBrightWhite'] || colors['terminal.ansiWhite'] || '#ffffff',
                    yellow: colors['terminal.ansiBrightYellow'] || colors['terminal.ansiYellow'] || '#ffff80'
                },
                normal: {
                    black: colors['terminal.ansiBlack'] || '#000000',
                    blue: colors['terminal.ansiBlue'] || '#0000ff',
                    cyan: colors['terminal.ansiCyan'] || '#00ffff',
                    green: colors['terminal.ansiGreen'] || '#00ff00',
                    magenta: colors['terminal.ansiMagenta'] || '#ff00ff',
                    red: colors['terminal.ansiRed'] || '#ff0000',
                    white: colors['terminal.ansiWhite'] || '#ffffff',
                    yellow: colors['terminal.ansiYellow'] || '#ffff00'
                }
            }
        };
    }

    /**
     * Convert VSCode theme to Zed format
     */
    convertToZed(vscodeTheme) {
        const colors = vscodeTheme.colors || {};
        const tokenColors = vscodeTheme.tokenColors || [];

        // Extract syntax colors from tokenColors
        const syntaxColors = this.extractSyntaxColors(tokenColors);

        return {
            $schema: "https://zed.dev/schema/themes/v0.2.0.json",
            name: vscodeTheme.name || 'Converted Theme',
            author: "Theme Converter",
            themes: [
                {
                    name: vscodeTheme.name || 'Converted Theme',
                    appearance: vscodeTheme.type || 'dark',
                    style: {
                        background: colors['editor.background'] || '#1e1e1e',
                        foreground: colors['editor.foreground'] || '#d4d4d4',
                        "editor.background": colors['editor.background'] || '#1e1e1e',
                        "editor.foreground": colors['editor.foreground'] || '#d4d4d4',
                        "editor.gutter.background": colors['editorGutter.background'] || colors['editor.background'] || '#1e1e1e',
                        "editor.line_number": colors['editorLineNumber.foreground'] || '#858585',
                        "editor.active_line_number": colors['editorLineNumber.activeForeground'] || colors['editorLineNumber.foreground'] || '#c6c6c6',
                        "editor.wrap_guide": colors['editorRuler.foreground'] || '#5a5a5a',
                        "editor.active_wrap_guide": colors['editorRuler.foreground'] || '#5a5a5a',
                        "panel.background": colors['panel.background'] || colors['editor.background'] || '#252526',
                        "sidebar.background": colors['sideBar.background'] || '#252526',
                        "tab_bar.background": colors['editorGroupHeader.tabsBackground'] || '#2d2d30',
                        "tab.inactive_background": colors['tab.inactiveBackground'] || '#2d2d30',
                        "tab.active_background": colors['tab.activeBackground'] || colors['editor.background'] || '#1e1e1e',
                        "status_bar.background": colors['statusBar.background'] || '#007acc',
                        "title_bar.background": colors['titleBar.activeBackground'] || '#3c3c3c',
                        "toolbar.background": colors['titleBar.activeBackground'] || '#3c3c3c',
                        syntax: syntaxColors
                    }
                }
            ]
        };
    }

    /**
     * Extract accent color from VSCode theme
     */
    extractAccentColor(colors) {
        // Try different potential accent colors in order of preference
        return colors['focusBorder'] || 
               colors['button.background'] || 
               colors['progressBar.background'] || 
               colors['list.activeSelectionBackground'] || 
               colors['activityBarBadge.background'] || 
               '#007acc';
    }

    /**
     * Extract and map syntax colors from VSCode tokenColors
     */
    extractSyntaxColors(tokenColors) {
        const syntaxMap = {};
        const mappings = {
            'comment': ['comment'],
            'string': ['string'],
            'number': ['constant.numeric'],
            'boolean': ['constant.language.boolean'],
            'keyword': ['keyword'],
            'function': ['entity.name.function', 'support.function'],
            'type': ['entity.name.type', 'storage.type', 'support.type'],
            'variable': ['variable'],
            'property': ['variable.other.property'],
            'tag': ['entity.name.tag'],
            'attribute': ['entity.other.attribute-name'],
            'constructor': ['entity.name.function.constructor'],
            'constant': ['constant'],
            'operator': ['keyword.operator'],
            'punctuation': ['punctuation']
        };

        // Map VSCode scopes to Zed syntax categories
        for (const tokenColor of tokenColors) {
            if (!tokenColor.scope || !tokenColor.settings) continue;
            
            const scopes = Array.isArray(tokenColor.scope) ? tokenColor.scope : [tokenColor.scope];
            
            for (const scope of scopes) {
                for (const [zedCategory, vscodeScopes] of Object.entries(mappings)) {
                    if (vscodeScopes.some(vscope => scope.includes(vscope))) {
                        const settings = tokenColor.settings;
                        if (settings.foreground) {
                            syntaxMap[zedCategory] = {
                                color: settings.foreground,
                                ...(settings.fontStyle && { font_style: settings.fontStyle })
                            };
                        }
                        break;
                    }
                }
            }
        }

        return syntaxMap;
    }

    /**
     * Save converted theme to file
     */
    saveTheme(theme, outputPath, format) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const content = format === 'warp' 
            ? yaml.dump(theme, { indent: 2, quotingType: '"' })
            : JSON.stringify(theme, null, 2);

        fs.writeFileSync(outputPath, content, 'utf8');
        console.log(`✅ Theme saved to: ${outputPath}`);
    }

    /**
     * Convert all themes in a directory
     */
    convertAll(inputDir, format, outputDir) {
        const files = fs.readdirSync(inputDir)
            .filter(file => file.endsWith('.json') && file.includes('color-theme'));

        const results = [];
        
        for (const file of files) {
            try {
                const inputPath = path.join(inputDir, file);
                const baseName = file.replace('-color-theme.json', '');
                const extension = format === 'warp' ? 'yaml' : 'json';
                const outputPath = path.join(outputDir, `${baseName}.${extension}`);
                
                this.convert(inputPath, format, outputPath);
                results.push({ input: file, output: outputPath, success: true });
                
                console.log(`✅ Converted: ${file} → ${path.basename(outputPath)}`);
            } catch (error) {
                results.push({ input: file, error: error.message, success: false });
                console.error(`❌ Failed to convert ${file}: ${error.message}`);
            }
        }

        return results;
    }
}

// Export for module usage
module.exports = ThemeConverter;

// CLI usage if run directly
if (require.main === module) {
    const args = process.argv.slice(2);
    
    function showHelp() {
        console.log('🎨 VSCode Theme Converter');
        console.log('Convert VSCode themes to Warp Terminal and Zed Editor formats\n');
        console.log('USAGE:');
        console.log('  node theme-converter.js <command> [options]\n');
        console.log('COMMANDS:');
        console.log('  convert <input-file> <format> [output-file]  Convert single theme');
        console.log('  batch <input-dir> <format> <output-dir>      Convert all themes in directory');
        console.log('  help                                         Show this help\n');
        console.log('FORMATS:');
        console.log('  warp    Warp Terminal (.yaml)');
        console.log('  zed     Zed Editor (.json)\n');
        console.log('EXAMPLES:');
        console.log('  node theme-converter.js convert themes/ghibli-color-theme.json warp');
        console.log('  node theme-converter.js convert themes/koi-pond-dark-color-theme.json zed output.json');
        console.log('  node theme-converter.js batch themes warp warp-themes');
        console.log('  node theme-converter.js batch themes zed zed-themes');
    }
    
    if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
        showHelp();
        process.exit(0);
    }
    
    const converter = new ThemeConverter();
    const command = args[0];
    
    try {
        if (command === 'convert') {
            if (args.length < 3) {
                console.error('❌ Error: convert command requires input file and format');
                console.log('Usage: node theme-converter.js convert <input-file> <format> [output-file]');
                process.exit(1);
            }
            
            const inputFile = args[1];
            const format = args[2];
            const outputFile = args[3];
            
            if (!converter.supportedFormats.includes(format)) {
                console.error(`❌ Error: Unsupported format "${format}"`);
                console.log(`Supported formats: ${converter.supportedFormats.join(', ')}`);
                process.exit(1);
            }
            
            if (!fs.existsSync(inputFile)) {
                console.error(`❌ Error: Input file "${inputFile}" does not exist`);
                process.exit(1);
            }
            
            console.log(`🔄 Converting ${inputFile} to ${format} format...`);
            const result = converter.convert(inputFile, format, outputFile);
            
            if (outputFile) {
                console.log(`✅ Successfully converted to ${outputFile}`);
            } else {
                console.log('✅ Conversion completed. Output:');
                const content = format === 'warp' 
                    ? yaml.dump(result, { indent: 2, quotingType: '"' })
                    : JSON.stringify(result, null, 2);
                console.log(content);
            }
            
        } else if (command === 'batch') {
            if (args.length < 4) {
                console.error('❌ Error: batch command requires input directory, format, and output directory');
                console.log('Usage: node theme-converter.js batch <input-dir> <format> <output-dir>');
                process.exit(1);
            }
            
            const inputDir = args[1];
            const format = args[2];
            const outputDir = args[3];
            
            if (!converter.supportedFormats.includes(format)) {
                console.error(`❌ Error: Unsupported format "${format}"`);
                console.log(`Supported formats: ${converter.supportedFormats.join(', ')}`);
                process.exit(1);
            }
            
            if (!fs.existsSync(inputDir)) {
                console.error(`❌ Error: Input directory "${inputDir}" does not exist`);
                process.exit(1);
            }
            
            console.log(`🔄 Batch converting themes from ${inputDir} to ${format} format...`);
            const results = converter.convertAll(inputDir, format, outputDir);
            
            const successful = results.filter(r => r.success).length;
            const failed = results.filter(r => !r.success).length;
            
            console.log(`\n📊 Conversion Summary:`);
            console.log(`  ✅ Successful: ${successful}`);
            console.log(`  ❌ Failed: ${failed}`);
            console.log(`  📁 Output directory: ${outputDir}`);
            
        } else {
            console.error(`❌ Error: Unknown command "${command}"`);
            console.log('Run "node theme-converter.js help" for usage information');
            process.exit(1);
        }
        
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}