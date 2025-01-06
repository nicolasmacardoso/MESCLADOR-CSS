const fileInputElement1 = document.getElementById("file1");
const fileInputElement2 = document.getElementById("file2");

const fileLabel1 = document.getElementById("fileLabel1");
const fileLabel2 = document.getElementById("fileLabel2");

fileInputElement1.addEventListener("change", function () {
    fileLabel1.textContent = this.files[0].name;
});
fileInputElement2.addEventListener("change", function () {
    fileLabel2.textContent = this.files[0].name;
});

function mesclarCSS() {
    function removerDuplicatas(cssContent) {
        const extractCSS = (css) => {
            const rulePattern = /([^{]+){([^}]+)}/g;
            const mediaQueryPattern = /(@media[^{]+\{)([\s\S]*?)}\s*(?=@media|$)/g;
            const rulesList = [], mediaQueries = [];
    
            css = css.replace(mediaQueryPattern, (_, mediaSelector, mediaRules) => {
                const parsedMediaRules = [];
                mediaRules.replace(rulePattern, (__, selector, rules) =>
                    parsedMediaRules.push({ selector: selector.trim(), rules: rules.trim() })
                );
                mediaQueries.push({ selector: mediaSelector.trim(), rules: parsedMediaRules });
                return "";
            });
    
            css.replace(rulePattern, (__, selector, rules) =>
                rulesList.push({ selector: selector.trim(), rules: rules.trim() })
            );
    
            return { rulesList, mediaQueries };
        };
    
        const mergeRules = (rules) => {
            const merged = [];
            const ruleMap = new Map();
    
            rules.forEach((rule) => {
                if (ruleMap.has(rule.selector)) {
                    const existingRule = ruleMap.get(rule.selector);
                    const combinedRules = [...new Set([...existingRule.split(";"), ...rule.rules.split(";")])]
                        .filter(Boolean)
                        .sort()
                        .join(";");
                    ruleMap.set(rule.selector, combinedRules);
                } else {
                    ruleMap.set(rule.selector, rule.rules);
                }
            });
    
            ruleMap.forEach((rules, selector) => merged.push({ selector, rules }));
            return merged;
        };
    
        const processMediaQueries = (mediaQueries) => {
            return mediaQueries.map((media) => ({
                selector: media.selector,
                rules: mergeRules(media.rules),
            }));
        };
    
        const { rulesList, mediaQueries } = extractCSS(cssContent);
        const mergedRules = mergeRules(rulesList);
        const mergedMediaQueries = processMediaQueries(mediaQueries);
    
        const outputCSS = [
            ...mergedRules.map((rule) => `${rule.selector} {\n    ${rule.rules}\n}`),
            ...mergedMediaQueries.map(
                (mq) =>
                    `${mq.selector} {\n${mq.rules
                        .map((rule) => `    ${rule.selector} {\n        ${rule.rules}\n    }`)
                        .join("\n")}\n}`
            ),
        ].join("\n\n");
    
        document.getElementById("result").textContent = outputCSS;
        alert("Duplicatas removidas com sucesso.");
    }

    function processarCSS(cssContent1, cssContent2, prefixValue) {
        const extractCSS = (css) => {
            const rulePattern = /([^{]+){([^}]+)}/g;
            const mediaQueryPattern = /(@media[^{]+\{)([\s\S]*?)}\s*(?=@media|$)/g;
            const rulesList = [], mediaQueries = [];
    
            css = css.replace(mediaQueryPattern, (_, mediaSelector, mediaRules) => {
                const parsedMediaRules = [];
                mediaRules.replace(rulePattern, (__, selector, rules) =>
                    parsedMediaRules.push({ selector: selector.trim(), rules: rules.trim() })
                );
                mediaQueries.push({ selector: mediaSelector.trim(), rules: parsedMediaRules });
                return "";
            });
    
            css.replace(rulePattern, (__, selector, rules) =>
                rulesList.push({ selector: selector.trim(), rules: rules.trim() })
            );
    
            return { rulesList, mediaQueries };
        };
    
        const { rulesList: rules1, mediaQueries: media1 } = extractCSS(cssContent1);
        const { rulesList: rules2, mediaQueries: media2 } = extractCSS(cssContent2);
    
        const mergedRules = [...rules1];
        const applyPrefix = (selector) =>
            selector
                .split(",")
                .map((sel) =>
                    sel.includes(".") || sel.includes("#")
                        ? `.${prefixValue + sel.replace(/^[.#]/, "")}`
                        : sel.trim()
                )
                .join(", ");
    
        rules2.forEach((rule) => {
            const existingRule = rules1.find((r) => r.selector === rule.selector);
            if (existingRule) {
                existingRule.rules += ";" + rule.rules;
            } else {
                mergedRules.push({ selector: applyPrefix(rule.selector), rules: rule.rules });
            }
        });
    
        const outputCSS = [
            ...mergedRules.map((rule) => `${rule.selector} {\n    ${rule.rules}\n}`),
        ].join("\n\n");
    
        document.getElementById("result").textContent = outputCSS;
        alert("Arquivos mesclados com sucesso.");
    }

    const prefixValue = document.getElementById("prefix").value;

    const fileInput1 = fileInputElement1.files[0];
    const fileInput2 = fileInputElement2.files[0];

    if (!fileInput1) {
        alert("Carregue pelo menos o arquivo CSS 1.");
        return;
    }

    const fileReader1 = new FileReader();
    let cssContent1, cssContent2;

    fileReader1.onload = (event1) => {
        cssContent1 = event1.target.result;

        if (!fileInput2) {
            removerDuplicatas(cssContent1);
            return;
        }

        const fileReader2 = new FileReader();
        fileReader2.onload = (event2) => {
            cssContent2 = event2.target.result;
            processarCSS(cssContent1, cssContent2, prefixValue);
        };

        fileReader2.readAsText(fileInput2);
    };

    fileReader1.readAsText(fileInput1);
}


function copiar() {
    navigator.clipboard.writeText(document.getElementById("result").textContent);
    alert("Copiado com sucesso!");
}
