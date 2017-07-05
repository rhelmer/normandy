import { message, Spin } from 'antd';
import autobind from 'autobind-decorator';
import { Map } from 'immutable';
import pt from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import QueryExtension from 'control_new/components/data/QueryExtension';
import ExtensionForm from 'control_new/components/extensions/ExtensionForm';
import { updateExtension } from 'control_new/state/extensions/actions';
import { getCurrentExtension, getCurrentExtensionPk } from 'control_new/state/extensions/selectors';


@connect(
  state => ({
    extensionPk: getCurrentExtensionPk(state),
    extension: getCurrentExtension(state),
  }),
  {
    updateExtension,
  },
)
@autobind
export default class EditExtensionPage extends React.Component {
  static propTypes = {
    updateExtension: pt.func.isRequired,
    extensionPk: pt.number.isRequired,
    extension: pt.instanceOf(Map).isRequired,
  }

  state = {
    formErrors: undefined,
  };

  /**
   * Update the existing extension and display a message.
   */
  async handleSubmit(values) {
    const { extensionPk } = this.props;
    try {
      await this.props.updateExtension(extensionPk, values);
      message.success('Extension saved');
    } catch (error) {
      message.error(
        'Extension cannot be saved. Please correct any errors listed in the form below.',
      );
      if (error.data) {
        this.setState({ formErrors: error.data });
      }
    }
  }

  render() {
    const { extension, extensionPk } = this.props;
    const Wrapper = extension ? 'div' : Spin;
    return (
      <Wrapper>
        <h2>Edit Extension</h2>
        <QueryExtension pk={extensionPk} />
        {extension &&
          <ExtensionForm
            extension={extension}
            onSubmit={this.handleSubmit}
            errors={this.state.formErrors}
          />
        }
      </Wrapper>
    );
  }
}
