function compareFiles() {
    const file1 = document.getElementById("file1").files[0];
    const file2 = document.getElementById("file2").files[0];
    const prefixo = document.getElementById('prefix').value;

    if (!file1 || !file2) {
        alert("Por favor, carregue ambos os arquivos CSS.");
        return;
    }

    const reader1 = new FileReader();
    const reader2 = new FileReader();

    reader1.onload = function (event1) {
        const content1 = event1.target.result;

        reader2.onload = function (event2) {
            const content2 = event2.target.result;

            const getCSSBlocks = (cssContent) => {
                const blockRegex = /([^{]+){([^}]+)}/g;
                const mediaQueryRegex = /(@media[^{]+\{)([\s\S]*?)}\s*(?=@media|$)/g;
                const blocks = [];
                const mediaQueries = [];
                let match;
                let mediaQueryMatch;
                let cssWithoutMediaQueries = cssContent;

                while ((mediaQueryMatch = mediaQueryRegex.exec(cssContent)) !== null) {
                    const mediaQuerySelector = mediaQueryMatch[1].trim();
                    const mediaQueryContent = mediaQueryMatch[2].trim();
                    cssWithoutMediaQueries = cssWithoutMediaQueries.replace(mediaQueryMatch[2],'').replace(mediaQueryMatch[1],'')

                    const mediaRules = [];
                    let innerMatch;
            
                    while ((innerMatch = blockRegex.exec(mediaQueryContent)) !== null) {
                        mediaRules.push({
                            selector: innerMatch[1].trim(),
                            rules: innerMatch[2].trim()
                        });
                    }
            
                    mediaQueries.push({
                        selector: mediaQuerySelector,
                        rules: mediaRules
                    });
                }
            
                while ((match = blockRegex.exec(cssWithoutMediaQueries)) !== null) {
                    blocks.push({
                        selector: match[1].trim(),
                        rules: match[2].trim()
                    });
                }
            
                return { blocks, mediaQueries };
            };
            
            const compareRules = (rules1, rules2) => {
                const normalize = (rules) => {
                    return rules.split(';').map(r => r.trim()).filter(Boolean).sort();
                };
                return normalize(rules1).join(';') !== normalize(rules2).join(';');
            };

            const { blocks: blocks1, mediaQueries: mediaQueries1 } = getCSSBlocks(content1);
            const { blocks: blocks2, mediaQueries: mediaQueries2 } = getCSSBlocks(content2);

            let result = [...blocks1];
            const processedSelectors = new Set(); 

            const addPrefixToSelectors = (selector) => {
                return selector.split(',').map(sel => {
                    if (sel.includes('.') || sel.includes('#')) {
                        return `.${prefixo + sel.replace(/^[.#]/, '')}`;
                    }
                    return sel.trim();
                }).join(', ');
            };

            blocks2.forEach(block2 => {
                if (!processedSelectors.has(block2.selector)) {
                    const match = blocks1.find(block1 => block1.selector === block2.selector);
                    if (match) {
                        if (compareRules(match.rules, block2.rules)) {
                            result.push({
                                selector: addPrefixToSelectors(block2.selector),
                                rules: block2.rules
                            });
                        }
                    } else {
                        result.push({
                            selector: block2.selector,
                            rules: block2.rules
                        });
                    }

                    processedSelectors.add(block2.selector);
                }
            });

            const handleMediaQueries = (mediaQueries1, mediaQueries2) => {
                const parseMediaQueries = (mediaQueries) => {
                    return mediaQueries.reduce((acc, mediaQuery) => {
                        const selector = mediaQuery.selector.trim();
                        acc[selector] = mediaQuery.rules;
                        return acc;
                    }, {});
                };
            
                const parsedMQ1 = parseMediaQueries(mediaQueries1);
                const parsedMQ2 = parseMediaQueries(mediaQueries2);
            
                const mergedSelectors = new Set([...Object.keys(parsedMQ1), ...Object.keys(parsedMQ2)]);
            
                const mergedMediaQueries = [];
            
                mergedSelectors.forEach((selector) => {
                    const rules1 = parsedMQ1[selector] || [];
                    const rules2 = parsedMQ2[selector] || [];
            
                    const processedSelectors = new Set(); 
                    const mergedRules = [...rules1]; 
            
                    rules2.forEach((rule2) => {
                        const matchingRule1 = rules1.find((rule1) => rule1.selector === rule2.selector);
            
                        if (matchingRule1) {
                            if (matchingRule1.rules !== rule2.rules) {
                                mergedRules.push({
                                    selector: addPrefixToSelectors(rule2.selector),
                                    rules: rule2.rules,
                                });
                            }
                        } else {
                            mergedRules.push(rule2);
                        }
            
                        processedSelectors.add(rule2.selector);
                    });
            
                    mergedMediaQueries.push({
                        selector,
                        rules: mergedRules,
                    });
                });
            
                return mergedMediaQueries;
            };            
                     
            const mergedMediaQueries = handleMediaQueries(
                mediaQueries1,
                mediaQueries2
            );
            
            const mergedContent = [
                ...result.map(block => `${block.selector} {\n    ${block.rules.split(';').map(rule => rule.trim()).filter(Boolean).join(';\n    ')};\n}`),
                ...mergedMediaQueries.map(mediaQuery => {
                    return `${mediaQuery.selector} \n${mediaQuery.rules.map(rule => `    ${rule.selector} {\n        ${rule.rules.split(';').map(r => r.trim()).join(';\n        ').trim()}\n    }`).join('\n\n')}\n}`;
                })
            ].join("\n\n");
            
            document.getElementById("differences").textContent = mergedContent;
        };

        reader2.readAsText(file2);
    };

    reader1.readAsText(file1);
}
