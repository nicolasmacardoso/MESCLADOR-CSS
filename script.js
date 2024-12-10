const fileInputElement1 = document.getElementById("file1");
const fileInputElement2 = document.getElementById("file2");

const fileLabel1 = document.getElementById('fileLabel1');
const fileLabel2 = document.getElementById('fileLabel2');

fileInputElement1.addEventListener('change', function(){
    fileLabel1.textContent = this.files[0].name
})
fileInputElement2.addEventListener('change', function(){
    fileLabel2.textContent = this.files[0].name
})

function mesclarCSS() {
    const prefixValue = document.getElementById("prefix").value;

    const fileInput1 = fileInputElement1.files[0];
    const fileInput2 = fileInputElement2.files[0];

    if (!fileInput1 || !fileInput2) {
        alert("Carregue ambos os arquivos CSS.");
        return;
    }

    const fileReader1 = new FileReader();
    const fileReader2 = new FileReader();

    let cssContent1, cssContent2;

    fileReader1.onload = (event1) => {
        cssContent1 = event1.target.result;

        fileReader2.onload = (event2) => {
            cssContent2 = event2.target.result;

            processarCSS(cssContent1, cssContent2, prefixValue);
        };

        fileReader2.readAsText(fileInput2);
    };

    fileReader1.readAsText(fileInput1);
}

function processarCSS(cssContent1, cssContent2, prefixValue) {
    const extractCSS = (css) => {
        const rulePattern = /([^{]+){([^}]+)}/g;
        const mediaQueryPattern = /(@media[^{]+\{)([\s\S]*?)}\s*(?=@media|$)/g;
        const keyframesPattern = /(@keyframes[^{]+\{)([\s\S]*?)}\s*(?=@keyframes|$)/g;
        const rulesList = [], mediaQueries = [], keyframes = [];

        css = css.replace(mediaQueryPattern, (_, mediaSelector, mediaRules) => {
            const parsedMediaRules = [];
            mediaRules.replace(rulePattern, (__, selector, rules) => parsedMediaRules.push({ selector: selector.trim(), rules: rules.trim() }));
            mediaQueries.push({ selector: mediaSelector.trim(), rules: parsedMediaRules });
            return "";
        });

        css = css.replace(keyframesPattern, (_, keyframesSelector, keyframesRules) => {
            const parsedKeyframesRules = [];
            keyframesRules.replace(rulePattern, (__, selector, rules) => parsedKeyframesRules.push({ selector: selector.trim(), rules: rules.trim() }));
            keyframes.push({ selector: keyframesSelector.trim(), rules: parsedKeyframesRules });
            return "";
        });

        css.replace(rulePattern, (__, selector, rules) => rulesList.push({ selector: selector.trim(), rules: rules.trim() }));

        return { rulesList, mediaQueries, keyframes };
    };

    const areRulesDifferent = (rules1, rules2) => {
        const normalize = (rules) => rules.split(";").map(rule => rule.trim()).filter(Boolean).sort().join(";");
        return normalize(rules1) !== normalize(rules2);
    };

    const { rulesList: rules1, mediaQueries: media1, keyframes: keyframes1 } = extractCSS(cssContent1);
    const { rulesList: rules2, mediaQueries: media2, keyframes: keyframes2 } = extractCSS(cssContent2);

    const mergedRules = [...rules1];
    const processedSelectors = new Set();

    const applyPrefix = (selector) => selector.split(",").map(sel => sel.includes(".") || sel.includes("#") ? `.${prefixValue + sel.replace(/^[.#]/, "")}` : sel.trim()).join(", ");

    rules2.forEach(rule => {
        if (!processedSelectors.has(rule.selector)) {
            const existingRule = rules1.find(r => r.selector === rule.selector);
            if (existingRule && areRulesDifferent(existingRule.rules, rule.rules)) {
                mergedRules.push({ selector: applyPrefix(rule.selector), rules: rule.rules });
            } else if (!existingRule) {
                mergedRules.push(rule);
            }
            processedSelectors.add(rule.selector);
        }
    });

    const mergeMediaQueries = (media1, media2) => {
        const convertToDictionary = (mediaQueries) => Object.fromEntries(mediaQueries.map(mq => [mq.selector, mq.rules]));
        const mediaDict1 = convertToDictionary(media1), mediaDict2 = convertToDictionary(media2);
        const allSelectors = new Set([...Object.keys(mediaDict1), ...Object.keys(mediaDict2)]);
        const mergedMediaQueries = [];

        allSelectors.forEach(selector => {
            const mediaRules1 = mediaDict1[selector] || [];
            const mediaRules2 = mediaDict2[selector] || [];
            const processedSelectors = new Set();
            const combinedRules = [...mediaRules1];

            mediaRules2.forEach(rule => {
                const existingRule = mediaRules1.find(r => r.selector === rule.selector);
                if (existingRule && areRulesDifferent(existingRule.rules, rule.rules)) {
                    combinedRules.push({ selector: applyPrefix(rule.selector), rules: rule.rules });
                } else if (!existingRule) {
                    combinedRules.push(rule);
                }
                processedSelectors.add(rule.selector);
            });

            mergedMediaQueries.push({ selector, rules: combinedRules });
        });

        return mergedMediaQueries;
    };

    const mergeKeyframes = (keyframes1, keyframes2) => {
        const convertToDictionary = (keyframes) => Object.fromEntries(keyframes.map(kf => [kf.selector, kf.rules]));
        const keyframesDict1 = convertToDictionary(keyframes1), keyframesDict2 = convertToDictionary(keyframes2);
        const allSelectors = new Set([...Object.keys(keyframesDict1), ...Object.keys(keyframesDict2)]);
        const mergedKeyframes = [];

        allSelectors.forEach(selector => {
            const keyframesRules1 = keyframesDict1[selector] || [];
            const keyframesRules2 = keyframesDict2[selector] || [];
            const processedSelectors = new Set();
            const combinedRules = [...keyframesRules1];

            keyframesRules2.forEach(rule => {
                const existingRule = keyframesRules1.find(r => r.selector === rule.selector);
                if (existingRule && areRulesDifferent(existingRule.rules, rule.rules)) {
                    combinedRules.push({ selector: applyPrefix(rule.selector) + "/* Keyframes do segundo arquivo: */", rules: "/*" + rule.rules + "*/" });
                } else if (!existingRule) {
                    combinedRules.push(rule);
                }
                processedSelectors.add(rule.selector);
            });

            mergedKeyframes.push({ selector, rules: combinedRules });
        });

        return mergedKeyframes;
    };

    const combinedMediaQueries = mergeMediaQueries(media1, media2);
    const combinedKeyframes = mergeKeyframes(keyframes1, keyframes2);

    const outputCSS = [
        ...mergedRules.map(rule => `${rule.selector} {\n    ${rule.rules.split(";").filter(Boolean).join(";    ")}\n}`),
        ...combinedMediaQueries.map(mq => `${mq.selector}\n${mq.rules.map(rule => `    ${rule.selector} {\n        ${rule.rules.split(";").filter(Boolean).join(";        ")}\n    }`).join("\n\n")}\n}`),
        ...combinedKeyframes.map(kf => `${kf.selector}\n${kf.rules.map(rule => `    ${rule.selector} {\n        ${rule.rules.split(";").filter(Boolean).join(";        ")}\n    }`).join("\n\n")}\n}`)
    ].join("\n\n");

    document.getElementById("result").textContent = outputCSS;

    alert("Arquivos mesclados com sucesso.");
}
function copiar () {
    navigator.clipboard.writeText(document.getElementById("result").textContent);
    alert("Copiado com sucesso!");
}
