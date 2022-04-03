import * as React from "react";

import Config from "../config"
import * as CompileConfig from "../../config.json";
import { Category, CategorySelection, CategorySkipOption } from "../types";

import { getCategorySuffix } from "../utils/categoryUtils";

export interface CategorySkipOptionsProps { 
    category: Category;
    selectedChannel: string;
    defaultColor?: string;
    defaultPreviewColor?: string;
}

export interface CategorySkipOptionsState {
    color: string;
    previewColor: string;
}

class CategorySkipOptionsComponent extends React.Component<CategorySkipOptionsProps, CategorySkipOptionsState> {

    constructor(props: CategorySkipOptionsProps) {
        super(props);

        // Setup state
        this.state = {
            color: props.defaultColor || Config.config.barTypes[this.props.category]?.color,
            previewColor: props.defaultPreviewColor || Config.config.barTypes["preview-" + this.props.category]?.color,
        }
    }

    render(): React.ReactElement {
        // Render the right settings based on whether we're configuring global or channel-specific
        let defaultOption;
        let categorySelections;
        if (this.props.selectedChannel == null) {
            defaultOption = "disable";
            categorySelections = Config.config.categorySelections;
        } else {
            defaultOption = "inherit";
            categorySelections = Config.config.channelSpecificSettings[this.props.selectedChannel].categorySelections;
        }
        // Set the default option properly
        for (const categorySelection of categorySelections) {
            if (categorySelection.name === this.props.category) {
                switch (categorySelection.option) {
                    case CategorySkipOption.Disabled:
                        defaultOption = "disable";
                        break;
                    case CategorySkipOption.ShowOverlay:
                        defaultOption = "showOverlay";
                        break;
                    case CategorySkipOption.ManualSkip:
                        defaultOption = "manualSkip";
                        break;
                    case CategorySkipOption.AutoSkip:
                        defaultOption = "autoSkip";
                        break;
                }

                break;
            }
        }

        return (
            <>
                <tr id={this.props.category + "OptionsRow"}
                    className="categoryTableElement">
                    <td id={this.props.category + "OptionName"}
                        className="categoryTableLabel">
                            {chrome.i18n.getMessage("category_" + this.props.category)}
                    </td>

                    <td id={this.props.category + "SkipOption"}
                        className="skipOption">
                        <select
                            className="optionsSelector"
                            key={this.props.selectedChannel} // This is why: https://stackoverflow.com/a/39239074
                            defaultValue={defaultOption}
                            onChange={this.skipOptionSelected.bind(this)}>
                                {this.getCategorySkipOptions()}
                        </select>
                    </td>

                    {this.props.selectedChannel == null &&
                        <>
                            <td id={this.props.category + "ColorOption"}
                                className="colorOption">
                                <input
                                    className="categoryColorTextBox option-text-box"
                                    type="color"
                                    onChange={(event) => this.setColorState(event, false)}
                                    value={this.state.color}/>
                            </td>

                            {this.props.category !== "exclusive_access" &&
                                <td id={this.props.category + "PreviewColorOption"}
                                    className="previewColorOption">
                                    <input
                                        className="categoryColorTextBox option-text-box"
                                        type="color"
                                        onChange={(event) => this.setColorState(event, true)}
                                        value={this.state.previewColor}/>
                                </td>
                            }
                        </>
                    }
                </tr>

                <tr id={this.props.category + "DescriptionRow"}
                    className="small-description categoryTableDescription">
                        <td
                            colSpan={2}>
                            {chrome.i18n.getMessage("category_" + this.props.category + "_description")}
                            {' '}
                            <a href={CompileConfig.wikiLinks[this.props.category]} target="_blank" rel="noreferrer">
                                {`${chrome.i18n.getMessage("LearnMore")}`}
                            </a>
                        </td>
                </tr>

            </>
        );
    }

    skipOptionSelected(event: React.ChangeEvent<HTMLSelectElement>): void {
        const categorySelections = this.props.selectedChannel == null ?
            Config.config.categorySelections :
            Config.config.channelSpecificSettings[this.props.selectedChannel].categorySelections;

        // Remove the existing category selection
        for (let i = 0; i < categorySelections.length; i++) {
            if (categorySelections[i].name === this.props.category) {
                categorySelections.splice(i, 1);

                this.forceSaveCategorySelections(categorySelections);

                break;
            }
        }

        // Select the new option
        let option: CategorySkipOption;
        switch (event.target.value) {
            case "inherit":
                return;
            case "disable":
                option = CategorySkipOption.Disabled;

                break;
            case "showOverlay":
                option = CategorySkipOption.ShowOverlay;

                break;
            case "manualSkip":
                option = CategorySkipOption.ManualSkip;

                break;
            case "autoSkip":
                option = CategorySkipOption.AutoSkip;

                break;
        }

        // Push the new selection
        categorySelections.push({
            name: this.props.category,
            option: option
        });

        this.forceSaveCategorySelections(categorySelections);
    }

    // Forces the Proxy to send this to the chrome storage API
    forceSaveCategorySelections(categorySelections: CategorySelection[]) {
        if (this.props.selectedChannel == null) {
            Config.config.categorySelections = categorySelections;
        } else {
            Config.config.channelSpecificSettings[this.props.selectedChannel].categorySelections = categorySelections;
            Config.config.channelSpecificSettings = Config.config.channelSpecificSettings;
        }
    }

    getCategorySkipOptions(): JSX.Element[] {
        const elements: JSX.Element[] = [];

        let optionNames = ["inherit", "disable", "showOverlay", "manualSkip", "autoSkip"];
        if (this.props.category === "exclusive_access") optionNames = ["inherit", "disable", "showOverlay"];

        for (const optionName of optionNames) {
            if (this.props.selectedChannel == null && optionName == "inherit")
                continue;
            elements.push(
                <option key={optionName} value={optionName}>
                    {chrome.i18n.getMessage(optionName !== "inherit" && optionName !== "disable" ?
                        optionName + getCategorySuffix(this.props.category) :
                        optionName)}
                </option>
            );
        }

        return elements;
    }

    setColorState(event: React.FormEvent<HTMLInputElement>, preview: boolean): void {
        if (preview) {
            this.setState({
                previewColor: event.currentTarget.value
            });

            Config.config.barTypes["preview-" + this.props.category].color = event.currentTarget.value;

        } else {
            this.setState({
                color: event.currentTarget.value
            });

            Config.config.barTypes[this.props.category].color = event.currentTarget.value;
        }

        // Make listener get called
        Config.config.barTypes = Config.config.barTypes;
    }
}

export default CategorySkipOptionsComponent;
